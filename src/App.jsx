import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { findPiece } from './data'

const videos = import.meta.glob('./assets/*.mp4', {
  eager: true,
  query: '?url',
  import: 'default',
})

const callouts = [
  { start: 2, point: [440, 470], path: 'M440 470 L280 250 L80 250', left: '8%', bottom: '75%', text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.' },
  { start: 7, point: [560, 470], path: 'M560 470 L740 310 L920 310', left: '60%', bottom: '69%', text: '' },
  { start: 12, point: [430, 530], path: 'M430 530 L280 640 L80 640', left: '8%', top: '64%', text: 'Ut enim ad minim veniam, quis nostrud exercitation.' },
  { start: 17, point: [570, 530], path: 'M570 530 L740 710 L920 710', left: '60%', top: '71%', text: 'Duis aute irure dolor in reprehenderit in voluptate.' },
  { start: 22, point: [500, 550], path: 'M500 550 L500 820', left: '34%', top: '82%', text: 'Excepteur sint occaecat cupidatat non proident.' },
]
const clamp = (value) => Math.max(0, Math.min(1, value))

function VideoWithCallouts({ src, title, scientificName, info }) {
  const videoRef = useRef(null)
  const headingRef = useRef(null)
  const titleMeasureRef = useRef(null)
  const overlayRef = useRef(null)
  const copyRefs = useRef({})
  const [connectorPaths, setConnectorPaths] = useState({})
  const [titleSize, setTitleSize] = useState()
  const [playbackTime, setPlaybackTime] = useState(0)
  const displayTitle = scientificName || title.toLocaleUpperCase('es')
  const letters = Array.from(displayTitle)
  const titleDuration = 0.3 + letters.length * 0.16
  const visibleLetters = Math.max(0, Math.floor((playbackTime - 0.3) / 0.16))

  useLayoutEffect(() => {
    let active = true
    const alignConnectors = () => {
      if (!active) return
      const bounds = overlayRef.current.getBoundingClientRect()
      if (!bounds.width || !bounds.height) return
      // Use screen pixels for both geometry and the animated stroke length.
      const x = value => value - bounds.left
      const y = value => value - bounds.top
      const paths = {}
      for (const callout of callouts) {
        const copy = copyRefs.current[callout.start]
        if (!copy) continue
        const content = copy.querySelector('.callout-text').getBoundingClientRect()
        const anchor = copy.querySelector('.callout-anchor').getBoundingClientRect()
        const px = callout.point[0] * bounds.width / 1000
        const py = callout.point[1] * bounds.height / 1000
        const sourceX = bounds.left + px
        const endX = x(anchor.left)
        const endY = y(anchor.top)
        if (callout.start === 2 || callout.start === 17) {
          paths[callout.start] = `M${px} ${py} L${endX} ${endY}`
        } else if (callout.start === 22) {
          // Keep the descending segment outside the sample card's actual frame.
          const sample = copyRefs.current[17]
          const frameLeft = sample
            ? sample.getBoundingClientRect().left + parseFloat(getComputedStyle(sample, '::before').left)
            : bounds.right
          const elbowX = Math.min(Math.max(sourceX, content.right), frameLeft - 12)
          paths[callout.start] = `M${px} ${py} L${x(elbowX)} ${endY} L${endX} ${endY}`
        } else {
          const left = content.left < sourceX
          const elbowX = left
            ? Math.min(sourceX - 24, content.left + content.width * .6)
            : Math.max(sourceX + 24, content.right - content.width * .6)
          paths[callout.start] = `M${px} ${py} L${x(elbowX)} ${endY} L${endX} ${endY}`
        }
      }
      setConnectorPaths(paths)
    }
    const observer = new ResizeObserver(alignConnectors)
    observer.observe(overlayRef.current)
    for (const node of Object.values(copyRefs.current)) if (node) observer.observe(node)

    alignConnectors()
    document.fonts.ready.then(alignConnectors)
    return () => { active = false; observer.disconnect() }
  }, [src, info])

  useEffect(() => {
    let active = true
    const fitTitle = () => {
      if (!active) return
      const measure = titleMeasureRef.current
      const available = headingRef.current.clientWidth
      const baseSize = parseFloat(getComputedStyle(measure).fontSize)
      const fullWidth = measure.getBoundingClientRect().width
      setTitleSize(baseSize * Math.min(1, available / fullWidth) * 0.97)
    }
    const observer = new ResizeObserver(fitTitle)
    observer.observe(headingRef.current)
    fitTitle()
    document.fonts.ready.then(fitTitle)
    return () => {
      active = false
      observer.disconnect()
    }
  }, [displayTitle])

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

  const pieceCallouts = info ? [
    { ...callouts[0], bottom: '66%', width: '46%', path: 'M440 470 L280 340 L80 340', text: `Familia: ${info.family}\nGénero: ${info.genus}\nEspecie: ${info.species}` },
    { ...callouts[1], bottom: '66%', path: 'M560 470 L740 340 L920 340' },
    { ...callouts[2], top: '58%', width: '40%', path: 'M430 530 L340 580 L80 580', text: `Nombres comunes: ${info.commonNames}\nTamaño medio: ${info.averageSize}` },
    { ...callouts[3], left: '62%', top: '65%', width: '34%', path: 'M570 530 L660 650 L960 650', text: `Recolección de la muestra:\n${info.collectedOn}\n${info.collectedAt}\nDepósito en Svalbard:\n${info.depositedOn}` },
    { ...callouts[4], left: '8%', top: '79%', width: '47%', path: 'M500 550 L500 790', text: info.uses },
  ] : callouts

  const annotations = pieceCallouts.filter(callout => callout.text).map((callout) => {
    const elapsed = playbackTime - titleDuration - (callout.start - callouts[0].start)
    const opacity = clamp(elapsed / 0.5)
    // El contenido termina de aparecer a los 3,2 s. Mantener la línea
    // un segundo más y desvanecerla durante 0,8 s, también en la última.
    const lineOpacity = opacity * (1 - clamp((elapsed - 4.2) / 0.8))
    return { ...callout, lineOpacity, draw: clamp(elapsed / 2.2), textOpacity: opacity * clamp(elapsed - 2.2) }
  })

  return <>
    <video ref={videoRef} src={src} autoPlay muted loop playsInline preload="metadata" />
    <div className="piece-heading" ref={headingRef}>
      <h1 className={`piece-title${scientificName ? ' piece-title-scientific' : ''}`} aria-label={displayTitle} style={{ fontSize: titleSize }}>
        <span className="piece-title-measure" ref={titleMeasureRef} aria-hidden="true">{displayTitle}</span>
        <span aria-hidden="true">{letters.slice(0, visibleLetters).join('')}</span>
      </h1>
      {scientificName && <p className="piece-common-name" style={{ opacity: clamp((playbackTime - titleDuration) / 0.5) }}>{title}</p>}
    </div>
    <div className="callout-overlay" ref={overlayRef} aria-hidden="true">
      <svg className="callout-lines">
        {annotations.map((callout) => <g key={callout.start} opacity={callout.lineOpacity}>
          <path d={connectorPaths[callout.start]} pathLength="1" strokeDasharray="1" strokeDashoffset={1 - callout.draw} />
        </g>)}
      </svg>
      {annotations.map((callout) => <div key={callout.start}>
        <span className="callout-point" style={{ left: `${callout.point[0] / 10}%`, top: `${callout.point[1] / 10}%`, opacity: callout.lineOpacity }} />
        <p ref={node => { copyRefs.current[callout.start] = node }} className={`callout-copy${info ? ' callout-copy-info' : ''}${callout.start === 2 ? ' callout-copy-simple' : ''}${callout.start === 17 ? ' callout-copy-boxed' : ''}`} style={{ left: callout.left, top: callout.top, bottom: callout.bottom, width: callout.width, opacity: callout.textOpacity }}>
          <span className="callout-anchor" />
          {callout.start === 17 && <span className="callout-card-heading"><strong>Muestra</strong></span>}
          <span className="callout-text">{callout.text}</span>
        </p>
      </div>)}
    </div>
  </>
}

export default function App() {
  const params = new URLSearchParams(window.location.search)
  const key = params.get('pieza')
  const piece = findPiece(key)
  const whiteBackground = params.get('fondo') !== 'negro' && Boolean(piece?.whiteVideoFile)
  const videoFile = whiteBackground ? piece.whiteVideoFile : piece?.videoFile
  const video = videoFile && videos[`./assets/${videoFile}`]

  return (
    <main className={`video-screen${whiteBackground ? ' video-screen-white' : ''}`}>
      <div className="video-stage">
        {video && <VideoWithCallouts key={video} src={video} title={piece.title} scientificName={piece.scientificName} info={piece.info} />}
      </div>
    </main>
  )
}
