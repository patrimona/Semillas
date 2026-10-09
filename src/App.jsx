import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { findPiece } from './data'
import mapImage from './assets/mapa.jpg'
import NfcPanel from './NfcPanel.jsx'
import DesktopRuntime from './DesktopRuntime.jsx'
import IdleScreen from './IdleScreen.jsx'

// Catálogo de vídeos: Vite convierte cada MP4 de assets en una URL utilizable.
// Los nombres, archivos y datos de cada semilla se definen en src/data.js.
const videos = import.meta.glob('./assets/*.mp4', {
  eager: true,
  query: '?url',
  import: 'default',
})

// Destinos: centro horizontal y borde superior, en porcentajes del escenario.
// Distribución de la referencia: taxonomía arriba a la derecha, nombre a la
// izquierda, usos abajo a la izquierda, muestra a la derecha y tamaño abajo.
const defaultCardPositions = [
  { x: 74, y: 11, width: 36 },
  { x: 18, y: 36, width: 24 },
  { x: 21, y: 65, width: 30 },
  { x: 84, y: 50, width: 22 },
  { x: 54.5, y: 61.5, width: 28 },
]
const SEED_POINTS = [[54,36], [40,45], [44,54], [61,53], [53,57.5]]
const CARD_INTERVAL = 7 // Segundos entre tarjetas.
const TITLE_PAUSE = 2.5 // Pausa tras el título antes de la primera cartela.
const CARD_DURATION = 4.5 // Recorrido algo más pausado, con arranque y llegada suaves.
const clamp = value => Math.max(0, Math.min(1, value))
const smoothstep = value => value * value * (3 - 2 * value)
const smootherstep = value => value ** 3 * (value * (value * 6 - 15) + 10)

// La tarjeta se aleja en la dirección de su flecha. El punto de la semilla y
// el ángulo no cambian; la punta llega al primer borde, sin atravesar el cuadro.
function cardMotion(position, index, elapsed, reducedMotion, geometry, sourcePoint = SEED_POINTS[index]) {
  const size = geometry.cards[index]
  const opacity = smoothstep(clamp(elapsed / .4))
  if (!size || !geometry.width || !geometry.height) return { x: position.x, y: position.y, opacity: 0 }
  const sourceX = sourcePoint[0] / 100 * geometry.width
  const sourceY = sourcePoint[1] / 100 * geometry.height
  const centerX = position.x / 100 * geometry.width
  // Los textos largos suben solo lo necesario para dejar libre el pie.
  const top = Math.min(position.y / 100 * geometry.height, geometry.height * .935 - size.height - geometry.height * .012)
  const centerY = top + size.height / 2
  const dx = sourceX - centerX
  const dy = sourceY - centerY
  const edge = Math.min(size.width / 2 / Math.max(Math.abs(dx), .001), size.height / 2 / Math.max(Math.abs(dy), .001))
  const finalX = centerX + dx * edge
  const finalY = centerY + dy * edge
  // Comienza a desplazarse durante la aparición, sin una pausa intermedia.
  const progress = smootherstep(clamp((elapsed - .15) / (CARD_DURATION - .15)))
  // La primera cartela nace a la derecha del título, con un margen del 2%.
  const clearance = centerX - size.width / 2 - geometry.titleRight - geometry.width * .02
  const initialTravel = index === 0
    ? Math.max(.3, clamp(1 - Math.max(0, clearance) / Math.max(.001, finalX - sourceX)))
    : .3
  const travel = reducedMotion ? 1 : initialTravel + (1 - initialTravel) * progress
  const offsetX = (sourceX - finalX) * (1 - travel)
  const offsetY = (sourceY - finalY) * (1 - travel)
  const growth = reducedMotion ? 1 : smoothstep(clamp(elapsed / .65))
  return {
    x: (centerX + offsetX) / geometry.width * 100,
    y: (top + offsetY) / geometry.height * 100,
    opacity,
    line: {
      x: sourceX, y: sourceY,
      path: `M${sourceX} ${sourceY} L${sourceX + (finalX - sourceX) * travel * growth} ${sourceY + (finalY - sourceY) * travel * growth}`,
    },
  }
}
function CardText({ text }) {
  return text.split(/(\*[^*]+\*)/g).map((part, index) =>
    part.startsWith('*') && part.endsWith('*')
      ? <em key={index}>{part.slice(1, -1)}</em>
      : part,
  )
}

function VideoWithCallouts({ src, title, subtitleName, scientificName, info, editorial, videoFraming, seedAnchors, cardOverrides }) {
  const cardPositions = defaultCardPositions.map((position, index) => ({ ...position, ...cardOverrides?.[index] }))
  // Referencias a elementos HTML para consultar el vídeo y medir textos y posiciones.
  const videoRef = useRef(null)
  const headingRef = useRef(null)
  const titleMeasureRef = useRef(null)
  const overlayRef = useRef(null)
  const cardRefs = useRef([])
  const [geometry, setGeometry] = useState({ width: 0, height: 0, cards: [] })
  const [reducedMotion, setReducedMotion] = useState(false)
  const arrowId = useId()
  // Estado del tamaño del título y del reloj compartido por todas las tarjetas.
  const [titleSize, setTitleSize] = useState({})
  const [playbackTime, setPlaybackTime] = useState(0)
  // Título letra a letra: espera inicial de 0,3 s y 0,16 s por carácter.
  // Si hay nombre científico, se usa como título y el nombre común queda debajo.
  // La referencia usa género y especie en cursiva, con la autoría en letra normal.
  const displayTitle = scientificName || title
  const [genus, species = '', ...authorWords] = scientificName ? scientificName.split(' ') : [title]
  const author = authorWords.join(' ')
  const letters = Array.from(displayTitle)
  const titleDuration = 0.3 + letters.length * 0.16
  const visibleLetters = Math.max(0, Math.floor((playbackTime - 0.3) / 0.16))

  // Ajusta cada línea por separado para que quepan también nombres científicos largos.
  useEffect(() => {
    let active = true
    const fitTitle = () => {
      if (!active) return
      const [genusMeasure, speciesMeasure, authorMeasure] = titleMeasureRef.current.children
      const available = headingRef.current.clientWidth
      const fit = (node, width) => parseFloat(getComputedStyle(node).fontSize) * Math.min(1, width / Math.max(1, node.getBoundingClientRect().width))
      setTitleSize({
        genus: fit(genusMeasure, available),
        species: fit(speciesMeasure, available * .98),
        author: fit(authorMeasure, available * .98),
      })
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
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  // Mide los tamaños sin transformar; las flechas usan la misma posición
  // que cada tarjeta en cada fotograma, también al redimensionar la pantalla.
  useLayoutEffect(() => {
    const align = () => {
      const { width, height, left } = overlayRef.current.getBoundingClientRect()
      const titleRight = headingRef.current.getBoundingClientRect().right - left
      setGeometry({ width, height, titleRight, cards: cardRefs.current.map(card => ({ width: card.offsetWidth, height: card.offsetHeight })) })
    }
    const observer = new ResizeObserver(align)
    observer.observe(overlayRef.current)
    observer.observe(headingRef.current)
    cardRefs.current.forEach(card => observer.observe(card))
    align()
    return () => observer.disconnect()
  }, [info])
  // Acumula el tiempo reproducido: las tarjetas esperan si el vídeo se pausa.
  useEffect(() => {
    let frame
    let previousTime = 0
    let totalTime = 0
    const sequenceDuration = titleDuration + TITLE_PAUSE + (cardPositions.length - 1) * CARD_INTERVAL + CARD_DURATION + 1
    const update = () => {
      const video = videoRef.current
      if (video && Number.isFinite(video.duration) && video.duration > 0) {
        const currentTime = video.currentTime
        // Si currentTime retrocede, se interpreta como el comienzo de otra vuelta.
        const delta = currentTime >= previousTime
          ? currentTime - previousTime
          : video.duration - previousTime + currentTime
        // Deja de acumular cuando ha terminado la última animación; los textos permanecen.
        totalTime = Math.min(sequenceDuration, totalTime + delta)
        previousTime = currentTime
        setPlaybackTime(totalTime)
      }
      if (totalTime < sequenceDuration) frame = requestAnimationFrame(update)
    }
    frame = requestAnimationFrame(update)
    return () => cancelAnimationFrame(frame)
  }, [src, titleDuration])
  // Contenido de las tarjetas; los datos se editan en src/data.js.
  const cards = info ? [
    {title:'Taxonomía',layout:'table',fields:[['Familia',info.family],['Género',info.genus],['Especie',info.species]]},
    {title:'La semilla',fields:[[info.commonNamesLabel || 'Nombres comunes',info.commonNames],['Tamaño medio',info.averageSize]]},
    {title:info.usesTitle || 'Usos',text:info.uses},
    {title:'Muestra',fields:[['Recolección',`${info.collectedOn}\n${info.collectedAt}`],['Depósito en Svalbard',info.depositedOn]]},
    {title:info.originTitle || 'Origen',text:info.origin},
  ] : [
    {title:'Taxonomía',text:'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'},
    {title:'Nombre común',text:title},
    {title:'Usos',text:'Excepteur sint occaecat cupidatat non proident.'},
    {title:'Muestra',text:'Duis aute irure dolor in reprehenderit in voluptate.'},
    {title:'Tamaño',text:'Información pendiente.'},
  ]
  const motions = cardPositions.map((position, index) => cardMotion(position, index, playbackTime - titleDuration - TITLE_PAUSE - index * CARD_INTERVAL, reducedMotion, geometry, seedAnchors?.[index]))
  const connectors = motions.map(motion => motion.line)
  // Compensa el cambio de encuadre manteniendo el tamaño visible anterior.
  const framingScale = videoFraming && geometry.width && geometry.height
    ? videoFraming.contentScale
      * Math.min(geometry.width, geometry.height * .58 * videoFraming.previousAspectRatio)
      / Math.min(geometry.width, geometry.height * .58 * videoFraming.aspectRatio)
    : 1
  return <>
    {/* Información editorial del encabezado y pie, separada de las tarjetas animadas. */}
    <header className="archive-header">
      <p className="archive-vault">Bóveda global<br />de semillas<br />de Svalbard<span className="editorial-dash" aria-hidden="true" /></p>
      <p className="archive-collection">Premio Princesa de Asturias<br />de Cooperación Internacional<br />2026</p>
      <p className="archive-coordinates"><span aria-hidden="true">+</span>{'78.23583° N\n15.49139° E'}</p>
    </header>
    <footer className="archive-footer">
      <p className="archive-source">{info?.sources
        ? `Fuentes: ${info.sources.join('\n')}`
        : 'Fuente: Inventario Nacional de Recursos Fitogenéticos\npara la Agricultura y la Alimentación'}<span className="editorial-dash" aria-hidden="true" /></p>
    </footer>
    {/* Mapa sobre el bloque derecho del pie; el encuadre elimina los márgenes de la foto. */}
    <figure className="archive-map">
      <img src={mapImage} alt="Mapa de España formado por puntos, con Baleares y Canarias" />
      {editorial?.mapPoint && <span
        className="archive-map-point"
        style={{ left: `${editorial.mapPoint.x}%`, top: `${editorial.mapPoint.y}%` }}
        role="img" aria-label={`Lugar de recolección: ${editorial.mapPoint.label}`} title={editorial.mapPoint.label}
      />}
    </figure>
    {/* Retícula editorial y guías: decorativas, no interfieren con el vídeo. */}
    <svg className="technical-guides" viewBox="0 0 1024 1536" preserveAspectRatio="none" aria-hidden="true">
      <ellipse cx="542.72" cy="714.24" rx="255" ry="250" strokeDasharray="4 7" />
      <path d="M46 34V134 M230 34V134 M918 34V134 M52 685V945 M574 927V1079 M414 1430V1502 M770 1430V1502 M962 500V735 M52 513H88" />
      <path d="M368 548H504 M638 1078V1400" strokeDasharray="2 5" />
    </svg>
    <video ref={videoRef} src={src} style={{ '--seed-framing-scale': framingScale }} autoPlay muted loop playsInline preload="auto" />
    <div className="piece-heading" ref={headingRef}>
      <div className="title-measures" ref={titleMeasureRef} aria-hidden="true">
        <span className="title-genus">{genus}</span><span className="title-species">{species}</span><span className="title-author">{author}</span>
      </div>
      <h1 className={`piece-title${scientificName ? ' piece-title-scientific' : ''}`} aria-label={displayTitle}>
        <span className="title-genus" style={{ fontSize: titleSize.genus }} aria-hidden="true">{genus.slice(0, visibleLetters)}<span className="title-strut">&#8203;</span></span>
        {species && <span className="title-second-line" aria-hidden="true">
          <span className="title-species" style={{ fontSize: titleSize.species }}>{species.slice(0, Math.max(0, visibleLetters - genus.length - 1))}<span className="title-strut">&#8203;</span></span>
          <span className="title-author" style={{ fontSize: titleSize.author }}>{author.slice(0, Math.max(0, visibleLetters - genus.length - species.length - 2))}</span>
        </span>}
      </h1>
      {/* El nombre común aparece en medio segundo al terminar el título científico. */}
      {scientificName && <p className="piece-common-name" style={{ opacity: clamp((playbackTime - titleDuration) / 0.5) }}>{subtitleName || title}</p>}
    </div>

    {/* Tarjetas y flechas comparten trayectoria y opacidad sincronizadas con el vídeo. */}
    <div className="cards-overlay" ref={overlayRef}>
      <svg className="seed-connectors" aria-hidden="true">
        <defs>
          <marker id={arrowId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto" markerUnits="userSpaceOnUse">
            <path className="arrow-tip" d="M1 1 L9 5 L1 9" />
          </marker>
        </defs>
        {connectors.map((line, index) => line && <g key={index} opacity={motions[index].opacity}>
          <path className="seed-connector-line" d={line.path} markerEnd={`url(#${arrowId})`} />
          <circle cx={line.x} cy={line.y} r="3" />
        </g>)}
      </svg>
      {cards.map((card, index) => {
        const elapsed = playbackTime - titleDuration - TITLE_PAUSE - index * CARD_INTERVAL
        const position = cardPositions[index]
        const motion = motions[index]
        return <article ref={node => { cardRefs.current[index] = node }} key={card.title} className="seed-card" aria-hidden={elapsed <= 0} style={{
          '--card-width': `${position.width}%`,
          left: `${position.x}%`, top: `${position.y}%`, opacity: motion.opacity,
          // Mover por transform evita recalcular la distribución en cada fotograma.
          transform: `translate3d(calc(-50% + ${(motion.x - position.x) * geometry.width / 100}px), ${(motion.y - position.y) * geometry.height / 100}px, 0)`,
          willChange: elapsed >= 0 && elapsed < CARD_DURATION ? 'transform, opacity' : 'auto',
          visibility: elapsed <= 0 ? 'hidden' : 'visible', zIndex: elapsed < CARD_DURATION ? 2 : 1,
        }}>
          <div className="card-number" aria-hidden="true"><span>{String(index + 1).padStart(2, '0')}</span><span /></div>
          <h2>{card.title}</h2>
          {/* Solo información principal: sin notas ni pies dentro de las tarjetas. */}
          {card.fields ? <dl className={`card-details${card.layout === 'table' ? ' card-details-table' : ''}`}>
            {card.fields.map(([label,value]) => <div key={label}>
              <dt>{label}:</dt><dd>{index === 1 && label === (info.commonNamesLabel || 'Nombres comunes') ? <strong>{value}</strong> : value}</dd>
            </div>)}
          </dl> : <p><CardText text={card.text} /></p>}
        </article>
      })}
    </div>
  </>
}
function PieceScreen({ pieceKey }) {
  // SELECCIÓN POR URL: ?pieza=algarroba busca la ficha por nombre o identificador.
  const params = new URLSearchParams(window.location.search)
  if (params.get('modo') === 'nfc') return <NfcPanel />
  const key = pieceKey ?? params.get('pieza')
  if (!key) return <IdleScreen />
  const piece = findPiece(key)
  // Fondo blanco por defecto; &fondo=negro selecciona el vídeo original sobre negro.
  // Si aún no existe la copia clara, reproduce el original en lugar de quedar vacío.
  const whiteBackground = params.get('fondo') !== 'negro' && Boolean(videos[`./assets/${piece?.whiteVideoFile}`])
  const videoFile = whiteBackground ? piece.whiteVideoFile : piece?.videoFile
  const video = videoFile && videos[`./assets/${videoFile}`]

  return (
    <main className={`video-screen${whiteBackground ? ' video-screen-white' : ''}`}>
      <div className="video-stage" style={{ '--seed-scale': piece?.videoScale ?? 1, '--seed-top': piece?.videoTop ?? '46.5%', '--title-line-gap': piece?.titleLineGap ?? '.2cqw' }}>
        {/* Sin vídeo no se muestra contenido. key reinicia la secuencia si cambia el vídeo. */}
        {video && <VideoWithCallouts key={video} src={video} title={piece.title} subtitleName={piece.subtitleName} scientificName={piece.scientificName} info={piece.info} number={piece.number} editorial={piece.editorial} videoFraming={piece.videoFraming} seedAnchors={piece.seedAnchors} cardOverrides={piece.cardOverrides} />}
      </div>
    </main>
  )
}

export default function App() {
  if (window.seedDesktop) return <DesktopRuntime renderPiece={(slug, token) => <PieceScreen key={token} pieceKey={slug} />} />
  return <PieceScreen />
}
