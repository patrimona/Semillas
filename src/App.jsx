import { useEffect, useRef, useState } from 'react'
import { findPiece } from './data'

const videos = import.meta.glob('./assets/*.mp4', {
  eager: true,
  query: '?url',
  import: 'default',
})

const callouts = [
  { start: 0.08, point: [440, 470], path: 'M440 470 L320 220 L120 220', bottom: '78%', text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.' },
  { start: 0.36, point: [560, 530], path: 'M560 530 L700 740 L880 740', top: '74%', text: 'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
  { start: 0.64, point: [480, 490], path: 'M480 490 L320 220 L120 220', bottom: '78%', text: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco.' },
]

const clamp = (value) => Math.max(0, Math.min(1, value))

function VideoWithCallouts({ src }) {
  const videoRef = useRef(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let frame
    const update = () => {
      const video = videoRef.current
      if (video && Number.isFinite(video.duration) && video.duration > 0) {
        setProgress(video.currentTime / video.duration)
      }
      frame = requestAnimationFrame(update)
    }
    frame = requestAnimationFrame(update)
    return () => cancelAnimationFrame(frame)
  }, [src])

  const annotations = callouts.map((callout) => {
    const elapsed = progress - callout.start
    const opacity = clamp(elapsed / 0.012) * clamp((0.28 - elapsed) / 0.035)
    return { ...callout, opacity, draw: clamp(elapsed / 0.065), textOpacity: opacity * clamp((elapsed - 0.055) / 0.035) }
  })

  return <>
    <video ref={videoRef} src={src} autoPlay muted loop playsInline preload="metadata" />
    <div className="callout-overlay" aria-hidden="true">
      <svg className="callout-lines" viewBox="0 0 1000 1000" preserveAspectRatio="none">
        {annotations.map((callout) => <g key={callout.start} opacity={callout.opacity}>
          <path d={callout.path} pathLength="1" strokeDasharray="1" strokeDashoffset={1 - callout.draw} />
        </g>)}
      </svg>
      {annotations.map((callout) => <div key={callout.start}>
        <span className="callout-point" style={{ left: `${callout.point[0] / 10}%`, top: `${callout.point[1] / 10}%`, opacity: callout.opacity }} />
        <p className="callout-copy" style={{ top: callout.top, bottom: callout.bottom, opacity: callout.textOpacity }}>{callout.text}</p>
      </div>)}
    </div>
  </>
}

export default function App() {
  const key = new URLSearchParams(window.location.search).get('pieza')
  const piece = findPiece(key)
  const video = piece?.videoFile && videos[`./assets/${piece.videoFile}`]

  return (
    <main className="video-screen">
      <div className="video-stage">
        {video && <VideoWithCallouts key={video} src={video} />}
      </div>
    </main>
  )
}
