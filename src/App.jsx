import { useEffect, useRef, useState } from 'react'
import { findPiece } from './data'

const videos = import.meta.glob('./assets/*.mp4', {
  eager: true,
  query: '?url',
  import: 'default',
})

const callouts = [
  { start: 2, point: [440, 470], path: 'M440 470 L320 250 L80 250', left: '8%', bottom: '75%', text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.' },
  { start: 7, point: [560, 470], path: 'M560 470 L700 250 L920 250', left: '60%', bottom: '75%', type: 'photo' },
  { start: 12, point: [430, 530], path: 'M430 530 L320 640 L80 640', left: '8%', top: '64%', text: 'Ut enim ad minim veniam, quis nostrud exercitation.' },
  { start: 17, point: [570, 530], path: 'M570 530 L700 640 L920 640', left: '60%', top: '64%', text: 'Duis aute irure dolor in reprehenderit in voluptate.' },
  { start: 22, point: [500, 550], path: 'M500 550 L500 820 L340 820', left: '34%', top: '82%', text: 'Excepteur sint occaecat cupidatat non proident.' },
]
const clamp = (value) => Math.max(0, Math.min(1, value))

function VideoWithCallouts({ src, title }) {
  const videoRef = useRef(null)
  const [playbackTime, setPlaybackTime] = useState(0)
  const letters = Array.from(title)
  const titleDuration = 0.3 + letters.length * 0.16
  const visibleLetters = Math.max(0, Math.floor((playbackTime - 0.3) / 0.16))

  useEffect(() => {
    let frame
    let previousTime = 0
    let totalTime = 0
    const update = () => {
      const video = videoRef.current
      if (video && Number.isFinite(video.duration) && video.duration > 0) {
        const currentTime = video.currentTime
        const delta = currentTime >= previousTime
          ? currentTime - previousTime
          : video.duration - previousTime + currentTime
        totalTime = Math.min(titleDuration + callouts.at(-1).start - callouts[0].start + 5, totalTime + delta)
        previousTime = currentTime
        setPlaybackTime(totalTime)
      }
      frame = requestAnimationFrame(update)
    }
    frame = requestAnimationFrame(update)
    return () => cancelAnimationFrame(frame)
  }, [src, titleDuration])

  const annotations = callouts.map((callout) => {
    const elapsed = playbackTime - titleDuration - (callout.start - callouts[0].start)
    const opacity = clamp(elapsed / 0.5)
    // El contenido termina de aparecer a los 3,2 s. Mantener la línea
    // un segundo más y desvanecerla durante 0,8 s, también en la última.
    const lineOpacity = opacity * (1 - clamp((elapsed - 4.2) / 0.8))
    return { ...callout, lineOpacity, draw: clamp(elapsed / 2.2), textOpacity: opacity * clamp((elapsed - 2) / 1.2) }
  })

  return <>
    <video ref={videoRef} src={src} autoPlay muted loop playsInline preload="metadata" />
    <h1 className="piece-title" aria-label={title}>
      <span aria-hidden="true">{letters.slice(0, visibleLetters).join('')}</span>
    </h1>
    <div className="callout-overlay" aria-hidden="true">
      <svg className="callout-lines" viewBox="0 0 1000 1000" preserveAspectRatio="none">
        {annotations.map((callout) => <g key={callout.start} opacity={callout.lineOpacity}>
          <path d={callout.path} pathLength="1" strokeDasharray="1" strokeDashoffset={1 - callout.draw} />
        </g>)}
      </svg>
      {annotations.map((callout) => <div key={callout.start}>
        <span className="callout-point" style={{ left: `${callout.point[0] / 10}%`, top: `${callout.point[1] / 10}%`, opacity: callout.lineOpacity }} />
        {callout.type === 'photo'
          ? <div className="callout-photo" style={{ left: callout.left, top: callout.top, bottom: callout.bottom, opacity: callout.textOpacity }} />
          : <p className="callout-copy" style={{ left: callout.left, top: callout.top, bottom: callout.bottom, opacity: callout.textOpacity }}>{callout.text}</p>}
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
        {video && <VideoWithCallouts key={video} src={video} title={piece.title} />}
      </div>
    </main>
  )
}
