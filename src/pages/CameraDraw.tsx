import { useCallback, useEffect, useRef, useState } from 'react'
import type { Camera as MediaPipeCamera } from '@mediapipe/camera_utils'
import type { FaceMesh as MediaPipeFaceMesh, Results as FaceResults } from '@mediapipe/face_mesh'
import type { Hands as MediaPipeHands, Results as HandResults } from '@mediapipe/hands'
import GlassButton from '../components/GlassButton'
import LiquidGlassCard from '../components/LiquidGlassCard'

type CanvasPoint = { x: number; y: number }

const FACE_ASSET_ROOT =
  'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/'
const HAND_ASSET_ROOT =
  'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/'

export default function CameraDraw() {
  const stageRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const dewCanvasRef = useRef<HTMLCanvasElement>(null)
  const pointerCanvasRef = useRef<HTMLCanvasElement>(null)
  const lastFingerRef = useRef<CanvasPoint | null>(null)
  const mouthOpenRef = useRef(false)
  const dewAmountRef = useRef(0)
  const isProcessingRef = useRef(false)
  const videoSizeRef = useRef({ width: 1280, height: 720 })
  const [status, setStatus] = useState('Warming up your camera...')
  const [error, setError] = useState('')
  const [isReady, setIsReady] = useState(false)

  const getContexts = useCallback(() => {
    const dew = dewCanvasRef.current?.getContext('2d')
    const pointer = pointerCanvasRef.current?.getContext('2d')
    return { dew, pointer }
  }, [])

  const resizeCanvases = useCallback(() => {
    const stage = stageRef.current
    const canvases = [dewCanvasRef.current, pointerCanvasRef.current]
    if (!stage) return

    const { width, height } = stage.getBoundingClientRect()
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)

    canvases.forEach((canvas) => {
      if (!canvas) return
      canvas.width = Math.round(width * pixelRatio)
      canvas.height = Math.round(height * pixelRatio)
    })
  }, [])

  const mapLandmarkToCanvas = useCallback((point: { x: number; y: number }) => {
    const canvas = dewCanvasRef.current
    const stage = stageRef.current
    if (!canvas || !stage) return null

    const stageRect = stage.getBoundingClientRect()
    const { width: videoWidth, height: videoHeight } = videoSizeRef.current
    const scale = Math.max(stageRect.width / videoWidth, stageRect.height / videoHeight)
    const renderedWidth = videoWidth * scale
    const renderedHeight = videoHeight * scale
    const cropX = (renderedWidth - stageRect.width) / 2
    const cropY = (renderedHeight - stageRect.height) / 2
    const pixelRatio = canvas.width / stageRect.width

    return {
      x: (stageRect.width - (point.x * renderedWidth - cropX)) * pixelRatio,
      y: (point.y * renderedHeight - cropY) * pixelRatio,
    }
  }, [])

  const addDew = useCallback(
    (mouthPoint?: { x: number; y: number }) => {
      const canvas = dewCanvasRef.current
      const { dew } = getContexts()
      if (!canvas || !dew) return

      // Add dew slowly in translucent layers so it feels like breath building up.
      dew.save()
      dew.globalCompositeOperation = 'source-over'
      dew.fillStyle = 'rgba(239, 247, 255, 0.017)'
      dew.fillRect(0, 0, canvas.width, canvas.height)

      const center = mouthPoint ? mapLandmarkToCanvas(mouthPoint) : null
      if (center) {
        const radius = Math.max(canvas.width, canvas.height) * 0.24
        const breath = dew.createRadialGradient(
          center.x,
          center.y,
          0,
          center.x,
          center.y,
          radius,
        )
        breath.addColorStop(0, 'rgba(250, 253, 255, 0.07)')
        breath.addColorStop(0.42, 'rgba(238, 246, 255, 0.035)')
        breath.addColorStop(1, 'rgba(235, 244, 255, 0)')
        dew.fillStyle = breath
        dew.beginPath()
        dew.arc(center.x, center.y, radius, 0, Math.PI * 2)
        dew.fill()
      }

      // Sparse bright specks become tiny water droplets as the fog thickens.
      const dropletCount = dewAmountRef.current > 0.35 ? 7 : 3
      for (let i = 0; i < dropletCount; i += 1) {
        const radius = (0.7 + Math.random() * 2.3) * (canvas.width / 1000)
        dew.fillStyle = `rgba(255,255,255,${0.08 + Math.random() * 0.2})`
        dew.beginPath()
        dew.arc(Math.random() * canvas.width, Math.random() * canvas.height, radius, 0, Math.PI * 2)
        dew.fill()
      }
      dew.restore()
      dewAmountRef.current = Math.min(1, dewAmountRef.current + 0.012)
    },
    [getContexts, mapLandmarkToCanvas],
  )

  const handleFaceResults = useCallback(
    (results: FaceResults) => {
      const landmarks = results.multiFaceLandmarks?.[0]
      if (!landmarks) {
        mouthOpenRef.current = false
        if (dewAmountRef.current < 0.05) setStatus('Open your mouth to create dew')
        return
      }

      // Detect an open mouth using the inner-lip gap divided by mouth width.
      const upperLip = landmarks[13]
      const lowerLip = landmarks[14]
      const leftCorner = landmarks[61]
      const rightCorner = landmarks[291]
      const mouthGap = Math.hypot(upperLip.x - lowerLip.x, upperLip.y - lowerLip.y)
      const mouthWidth = Math.hypot(
        leftCorner.x - rightCorner.x,
        leftCorner.y - rightCorner.y,
      )
      const mouthRatio = mouthGap / Math.max(mouthWidth, 0.001)
      const isOpen = mouthRatio > 0.14

      mouthOpenRef.current = isOpen
      if (isOpen) {
        setStatus('Dew is forming...')
        addDew({
          x: (upperLip.x + lowerLip.x) / 2,
          y: (upperLip.y + lowerLip.y) / 2,
        })
      } else if (dewAmountRef.current < 0.05) {
        setStatus('Open your mouth to create dew')
      }
    },
    [addDew],
  )

  const handleHandResults = useCallback(
    (results: HandResults) => {
      const pointerCanvas = pointerCanvasRef.current
      const dewCanvas = dewCanvasRef.current
      const { dew, pointer } = getContexts()
      if (!pointerCanvas || !dewCanvas || !dew || !pointer) return

      pointer.clearRect(0, 0, pointerCanvas.width, pointerCanvas.height)
      const landmarks = results.multiHandLandmarks?.[0]
      if (!landmarks) {
        lastFingerRef.current = null
        return
      }

      const indexTip = landmarks[8]
      const indexPip = landmarks[6]
      const fingerPoint = mapLandmarkToCanvas(indexTip)
      const fingerRaised = indexTip.y < indexPip.y
      if (!fingerPoint || !fingerRaised) {
        lastFingerRef.current = null
        return
      }

      const pixelRatio = dewCanvas.width / Math.max(dewCanvas.clientWidth, 1)
      const brushRadius = 24 * pixelRatio

      pointer.save()
      pointer.shadowColor = 'rgba(255,255,255,.85)'
      pointer.shadowBlur = 18 * pixelRatio
      pointer.fillStyle = 'rgba(255,255,255,.94)'
      pointer.beginPath()
      pointer.arc(fingerPoint.x, fingerPoint.y, 4.5 * pixelRatio, 0, Math.PI * 2)
      pointer.fill()
      pointer.strokeStyle = 'rgba(255,255,255,.38)'
      pointer.lineWidth = pixelRatio
      pointer.beginPath()
      pointer.arc(fingerPoint.x, fingerPoint.y, brushRadius, 0, Math.PI * 2)
      pointer.stroke()
      pointer.restore()

      if (dewAmountRef.current > 0.04) {
        setStatus('Draw with your finger')
        const previous = lastFingerRef.current

        // Erase the fog along the fingertip path, like drawing on a misty window.
        dew.save()
        dew.globalCompositeOperation = 'destination-out'
        dew.lineCap = 'round'
        dew.lineJoin = 'round'
        dew.lineWidth = brushRadius * 2
        dew.beginPath()
        if (previous) dew.moveTo(previous.x, previous.y)
        else dew.moveTo(fingerPoint.x, fingerPoint.y)
        dew.lineTo(fingerPoint.x, fingerPoint.y)
        dew.stroke()
        dew.restore()
      }

      lastFingerRef.current = fingerPoint
    },
    [getContexts, mapLandmarkToCanvas],
  )

  const resetDew = useCallback(() => {
    const dewCanvas = dewCanvasRef.current
    const pointerCanvas = pointerCanvasRef.current
    const { dew, pointer } = getContexts()

    // Reset both visual layers and return to the first instruction.
    if (dewCanvas && dew) dew.clearRect(0, 0, dewCanvas.width, dewCanvas.height)
    if (pointerCanvas && pointer) {
      pointer.clearRect(0, 0, pointerCanvas.width, pointerCanvas.height)
    }
    dewAmountRef.current = 0
    lastFingerRef.current = null
    setStatus('Open your mouth to create dew')
  }, [getContexts])

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    resizeCanvases()
    const observer = new ResizeObserver(resizeCanvases)
    observer.observe(stage)
    return () => observer.disconnect()
  }, [resizeCanvases])

  useEffect(() => {
    let camera: MediaPipeCamera | null = null
    let faceMesh: MediaPipeFaceMesh | null = null
    let hands: MediaPipeHands | null = null
    let isMounted = true
    const video = videoRef.current

    const startCamera = async () => {
      if (!video || !navigator.mediaDevices?.getUserMedia) {
        setError('Camera access is not supported in this browser. Try a recent Chrome or Safari.')
        return
      }

      try {
        faceMesh = new window.FaceMesh({ locateFile: (file) => `${FACE_ASSET_ROOT}${file}` })
        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.55,
          minTrackingConfidence: 0.55,
        })
        faceMesh.onResults(handleFaceResults)

        hands = new window.Hands({ locateFile: (file) => `${HAND_ASSET_ROOT}${file}` })
        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.55,
          minTrackingConfidence: 0.55,
        })
        hands.onResults(handleHandResults)

        camera = new window.Camera(video, {
          width: 1280,
          height: 720,
          onFrame: async () => {
            if (!faceMesh || !hands || isProcessingRef.current || video.readyState < 2) return
            isProcessingRef.current = true
            videoSizeRef.current = {
              width: video.videoWidth || 1280,
              height: video.videoHeight || 720,
            }
            try {
              await faceMesh.send({ image: video })
              await hands.send({ image: video })
            } finally {
              isProcessingRef.current = false
            }
          },
        })

        await camera.start()
        if (isMounted) {
          setIsReady(true)
          setStatus('Open your mouth to create dew')
        }
      } catch (cameraError) {
        console.error(cameraError)
        if (isMounted) {
          setError(
            'We could not open your camera. Allow camera access, then refresh this page to try again.',
          )
        }
      }
    }

    void startCamera()

    return () => {
      isMounted = false
      camera?.stop()
      void faceMesh?.close()
      void hands?.close()
    }
  }, [handleFaceResults, handleHandResults])

  useEffect(() => {
    let animationFrame = 0
    let lastFade = performance.now()

    const fadeDew = (now: number) => {
      if (!mouthOpenRef.current && now - lastFade > 120) {
        const canvas = dewCanvasRef.current
        const dew = canvas?.getContext('2d')
        if (canvas && dew && dewAmountRef.current > 0) {
          dew.save()
          dew.globalCompositeOperation = 'destination-out'
          dew.fillStyle = 'rgba(0,0,0,0.0018)'
          dew.fillRect(0, 0, canvas.width, canvas.height)
          dew.restore()
          dewAmountRef.current = Math.max(0, dewAmountRef.current - 0.00035)
        }
        lastFade = now
      }
      animationFrame = requestAnimationFrame(fadeDew)
    }

    animationFrame = requestAnimationFrame(fadeDew)
    return () => cancelAnimationFrame(animationFrame)
  }, [])

  return (
    <main className="camera-page">
      <div className="camera-stage" ref={stageRef}>
        <video ref={videoRef} className="camera-video" autoPlay playsInline muted />
        <div className="camera-tint" aria-hidden="true" />
        <canvas ref={dewCanvasRef} className="camera-canvas camera-canvas--dew" />
        <canvas ref={pointerCanvasRef} className="camera-canvas camera-canvas--pointer" />

        <header className="camera-header">
          <a className="brand brand--camera" href="/" aria-label="Back to Draw Ur Dew home">
            <span className="brand__drop" aria-hidden="true" />
            Draw Ur Dew
          </a>
          <div className={`camera-live ${isReady ? 'camera-live--ready' : ''}`}>
            <span /> {isReady ? 'camera live' : 'connecting'}
          </div>
        </header>

        {!error && !isReady && (
          <LiquidGlassCard className="camera-loading" role="status">
            <span className="camera-loading__orb" />
            <p>Opening your camera</p>
            <small>Keep this tab in view for the smoothest tracking.</small>
          </LiquidGlassCard>
        )}

        {error && (
          <LiquidGlassCard className="camera-error" role="alert">
            <span className="camera-error__icon" aria-hidden="true">!</span>
            <p className="eyebrow">Camera unavailable</p>
            <h1>We need a window into your world.</h1>
            <p>{error}</p>
            <GlassButton to="/" className="glass-button--compact">Back Home</GlassButton>
          </LiquidGlassCard>
        )}

        {!error && (
          <div className="camera-controls">
            <LiquidGlassCard className="status-pill" role="status" aria-live="polite">
              <span className="status-pill__signal">
                <span />
              </span>
              <div>
                <small>Now</small>
                <strong>{status}</strong>
              </div>
            </LiquidGlassCard>

            <div className="camera-actions">
              <GlassButton to="/" className="glass-button--compact">← Back Home</GlassButton>
              <GlassButton className="glass-button--compact" onClick={resetDew}>
                Reset Dew
              </GlassButton>
            </div>
          </div>
        )}

        <span className="camera-edge-note camera-edge-note--left">move gently</span>
        <span className="camera-edge-note camera-edge-note--right">stay curious</span>
      </div>
    </main>
  )
}
