import type { Camera } from '@mediapipe/camera_utils'
import type { FaceMesh } from '@mediapipe/face_mesh'
import type { Hands } from '@mediapipe/hands'

declare global {
  interface Window {
    Camera: typeof Camera
    FaceMesh: typeof FaceMesh
    Hands: typeof Hands
  }
}

export {}
