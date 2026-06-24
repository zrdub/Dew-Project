import GlassButton from '../components/GlassButton'
import LiquidGlassCard from '../components/LiquidGlassCard'

export default function Home() {
  return (
    <main className="home-page">
      <div className="ambient-orb ambient-orb--one" aria-hidden="true" />
      <div className="ambient-orb ambient-orb--two" aria-hidden="true" />
      <div className="ambient-orb ambient-orb--three" aria-hidden="true" />

      <nav className="home-nav" aria-label="Main navigation">
        <a className="brand" href="#top" aria-label="Draw Ur Dew home">
          <span className="brand__drop" aria-hidden="true" />
          Draw Ur Dew
        </a>
        <span className="home-nav__hint">made for tiny moments</span>
      </nav>

      <section className="home-hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Your breath. Your canvas.</p>
          <h1>
            Leave a little mark
            <span> on the moment.</span>
          </h1>
          <p className="hero-description">
            Open your camera, make some dew, and draw with your finger.
          </p>

          <div className="hero-action">
            <GlassButton to="/draw" className="glass-button--primary" icon={<span>↗</span>}>
              draw ur dew
            </GlassButton>
            <span className="privacy-note">
              <span className="privacy-note__dot" /> Nothing leaves your device
            </span>
          </div>
        </div>

        <div className="dew-frame-wrap">
          <div className="frame-note frame-note--top">breathe here</div>
          <LiquidGlassCard className="dew-frame">
            <svg
              className="dew-art"
              viewBox="0 0 760 560"
              role="img"
              aria-label="The words have fun drawn through a foggy glass surface"
              preserveAspectRatio="none"
            >
              <defs>
                <filter id="frost-noise" x="-10%" y="-10%" width="120%" height="120%">
                  <feTurbulence
                    type="fractalNoise"
                    baseFrequency="0.85"
                    numOctaves="3"
                    seed="8"
                    result="noise"
                  />
                  <feColorMatrix in="noise" type="saturate" values="0" result="grayNoise" />
                  <feBlend in="SourceGraphic" in2="grayNoise" mode="soft-light" />
                </filter>
                <filter id="writing-soften" x="-10%" y="-20%" width="120%" height="140%">
                  <feGaussianBlur stdDeviation="1.6" />
                </filter>
                <mask id="finger-writing">
                  <rect width="760" height="560" fill="white" />
                  <text
                    x="380"
                    y="315"
                    textAnchor="middle"
                    fill="black"
                    fontFamily="Segoe Print, Bradley Hand, Comic Sans MS, cursive"
                    fontSize="98"
                    fontWeight="500"
                    letterSpacing="-6"
                    transform="rotate(-4 380 280)"
                    filter="url(#writing-soften)"
                  >
                    have fun :)
                  </text>
                </mask>
                <radialGradient id="dew-glow" cx="48%" cy="38%" r="70%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.84" />
                  <stop offset="58%" stopColor="#eaf4ff" stopOpacity="0.63" />
                  <stop offset="100%" stopColor="#dbe6fb" stopOpacity="0.35" />
                </radialGradient>
              </defs>

              <rect
                width="760"
                height="560"
                fill="url(#dew-glow)"
                filter="url(#frost-noise)"
                mask="url(#finger-writing)"
              />
              <g className="dew-droplets" fill="#ffffff">
                <circle cx="92" cy="104" r="4" opacity=".48" />
                <circle cx="170" cy="80" r="2.5" opacity=".64" />
                <circle cx="665" cy="126" r="4.5" opacity=".55" />
                <circle cx="588" cy="72" r="2.5" opacity=".48" />
                <circle cx="704" cy="388" r="3" opacity=".66" />
                <circle cx="115" cy="430" r="3.5" opacity=".52" />
                <circle cx="610" cy="470" r="2" opacity=".72" />
                <circle cx="230" cy="470" r="2.5" opacity=".56" />
              </g>
            </svg>
            <div className="dew-frame__shine" aria-hidden="true" />
            <span className="dew-frame__corner dew-frame__corner--left">01</span>
            <span className="dew-frame__corner dew-frame__corner--right">a quiet canvas</span>
          </LiquidGlassCard>
          <div className="frame-note frame-note--bottom">draw what feels good</div>
        </div>
      </section>

      <footer className="home-footer">
        <span>Camera + hand tracking</span>
        <span className="home-footer__line" />
        <span>Made to disappear</span>
      </footer>
    </main>
  )
}
