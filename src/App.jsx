import { findPiece } from './data'

const videos = import.meta.glob('./assets/*.mp4', {
  eager: true,
  query: '?url',
  import: 'default',
})

export default function App() {
  const key = new URLSearchParams(window.location.search).get('pieza')
  const piece = findPiece(key)
  const video = piece?.videoFile && videos[`./assets/${piece.videoFile}`]

  return (
    <main className="video-screen">
      <div className="video-stage">
        {video && <video src={video} autoPlay muted loop playsInline preload="metadata" />}
      </div>
    </main>
  )
}
