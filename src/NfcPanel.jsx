import { useState } from 'react'
import { elements, findPiece } from './data.js'
import { useNfc } from './useNfc.js'
import { seedUrl } from './nfc.js'
export default function NfcPanel() {
  const nfc = useNfc()
  const [tag, setTag] = useState(null)
  const [slug, setSlug] = useState('')
  const [base, setBase] = useState(window.location.href)
  const [confirmed, setConfirmed] = useState(false)
  const [written, setWritten] = useState('')
  const busy = ['scanning', 'checking', 'writing', 'verifying'].includes(nfc.status)
  let url = '', urlError = ''
  try { if (slug) url = seedUrl(base, slug) } catch (err) { urlError = err.message }
  const read = async () => {
    setTag(null); setSlug(''); setConfirmed(false); setWritten('')
    const result = await nfc.scan()
    if (!result) return
    setTag(result)
    for (const value of result.values) {
      let key = value
      try { key = new URL(value).searchParams.get('pieza') } catch { /* Identificador antiguo. */ }
      const piece = findPiece(key)
      if (piece) { setSlug(piece.slug); break }
    }
  }
  const write = async () => {
    setWritten('')
    const result = await nfc.write(url, tag)
    if (result) { setTag(result); setWritten(url); setConfirmed(false) }
  }
  const messages = {
    scanning: 'Acerca la pegatina al móvil para leerla.',
    checking: 'Vuelve a acercar la misma pegatina y mantenla junto al móvil.',
    writing: 'Grabando el enlace. Mantén la pegatina junto al móvil.',
    verifying: 'Comprobando la grabación. Si hace falta, retira y acerca de nuevo la pegatina.',
  }
  return <main className="nfc-page">
    <h1>Asignar semillas a pegatinas NFC</h1>
    <p>Lee una pegatina, elige su semilla y graba el enlace para abrir su ficha.</p>
    {!nfc.supported && <p role="status">Para leer y grabar necesitas Chrome en un móvil Android con NFC, y abrir esta página mediante HTTPS.</p>}
    <button disabled={!nfc.supported || busy} onClick={read}>1. Leer pegatina</button>
    {tag && <section>
      <h2>Pegatina leída</h2>
      <p>Código: <strong>{tag.serialNumber || 'La pegatina no proporciona un código'}</strong></p>
      {!tag.serialNumber && <p>Mantén la misma pegatina junto al móvil durante la asignación.</p>}
      <p>Contenido actual: {tag.values.length ? tag.values.join(' · ') : tag.hasContent ? 'Contiene otros datos' : 'Vacía'}</p>
      <label>2. Semilla<select value={slug} disabled={busy} onChange={e => { setSlug(e.target.value); setConfirmed(false); setWritten('') }}>
        <option value="">Selecciona una semilla</option>
        {elements.map(piece => <option key={piece.slug} value={piece.slug}>{piece.subtitleName || piece.title} — {piece.scientificName}</option>)}
      </select></label>
      <label>Dirección publicada del interactivo<input type="url" value={base} disabled={busy} onChange={e => { setBase(e.target.value); setConfirmed(false); setWritten('') }} /></label>
      {urlError && <p role="alert">{urlError}</p>}
      {url && <p>Enlace que se grabará: <a href={url}>{url}</a></p>}
      {tag.hasContent && <label className="nfc-confirm"><input type="checkbox" checked={confirmed} disabled={busy} onChange={e => setConfirmed(e.target.checked)} />Reemplazar el contenido actual de esta pegatina.</label>}
      <button disabled={!nfc.supported || busy || !url || (tag.hasContent && !confirmed)} onClick={write}>3. Grabar semilla en la pegatina</button>
      {slug && <p><a href={`?pieza=${slug}`}>Ver la ficha de la semilla</a></p>}
    </section>}
    <p role="status" aria-live="polite">{messages[nfc.status] || (written ? 'Enlace grabado y comprobado correctamente.' : '')}</p>
    {written && <p><a href={written}>Abrir la ficha grabada</a></p>}
    {nfc.error && <p role="alert">{nfc.error}</p>}
    {busy && <button onClick={nfc.stop}>Cancelar</button>}
  </main>
}
