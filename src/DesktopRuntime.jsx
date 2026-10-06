import { useEffect, useState } from 'react'
import { elements, findPiece } from './data.js'
import IdleScreen from './IdleScreen.jsx'

export default function DesktopRuntime({ renderPiece }) {
  const bridge = window.seedDesktop
  const [mode, setMode] = useState('view')
  const [tags, setTags] = useState({})
  const [tag, setTag] = useState(null)
  const [slug, setSlug] = useState('')
  const [piece, setPiece] = useState(null)
  const [status, setStatus] = useState({ message: 'Buscando el lector ACR1552U…' })
  const [storagePath, setStoragePath] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let active = true
    bridge.getState().then(state => {
      if (!active) return
      setTags(state.tags); setStatus(state.status); setStoragePath(state.storagePath); setReady(true)
    }).catch(err => { if (active) setError(err.message) })
    const offTag = bridge.onTag(async value => {
      try {
        const state = await bridge.getState()
        if (!active) return
        setTags(state.tags); setTag(value); setSlug(state.tags[value.uid] || '')
        setPiece(state.tags[value.uid] ? { slug: state.tags[value.uid], token: Date.now() } : null)
        setConfirmed(false); setNotice(''); setError(''); setReady(true)
      } catch (err) { if (active) { setPiece(null); setError(err.message) } }
    })
    const offStatus = bridge.onStatus(value => { if (active) setStatus(value) })
    const offMode = bridge.onMode(value => setMode(value))
    const keyboard = event => {
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'a') {
        event.preventDefault(); setMode(current => current === 'nfc' ? 'view' : 'nfc')
      }
    }
    window.addEventListener('keydown', keyboard)
    return () => { active = false; offTag(); offStatus(); offMode(); window.removeEventListener('keydown', keyboard) }
  }, [bridge])
  const save = async () => {
    setSaving(true); setError(''); setNotice('')
    try {
      const result = await bridge.save(tag.uid, slug, tags[tag.uid] || null)
      setTags(result.tags); setConfirmed(false); setNotice('Asociación guardada en este ordenador. Ya puedes usar la tarjeta sin internet.')
      setPiece({ slug, token: Date.now() })
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }
  const exportBackup = async () => {
    try { if (await bridge.exportBackup()) setNotice('Copia de las asociaciones exportada.') }
    catch (err) { setError(err.message) }
  }
  if (mode === 'view' && piece) return renderPiece(piece.slug, piece.token)
  if (mode === 'view') return <IdleScreen />
  const existing = tag && tags[tag.uid]
  return <main className="nfc-page">
    <h1>{mode === 'nfc' ? 'Asignar tarjetas a semillas' : 'Semillas · sin conexión'}</h1>
    <p role="status" aria-live="polite">{status.message}</p>
    {mode === 'view' ? <>
      <p>Acerca una tarjeta al lector para ver su semilla.</p>
      {tag && !tags[tag.uid] && <p>Esta tarjeta todavía no tiene una semilla asignada.</p>}
      <button onClick={() => setMode('nfc')}>Asignar tarjetas</button>
    </> : <>
      <p>Acerca una tarjeta al ACR1552U, selecciona la semilla y guarda la asociación.</p>
      <button onClick={() => setMode('view')}>Ver semillas</button>
      {tag ? <section>
        <p>Código de la tarjeta: <strong>{tag.uid}</strong></p>
        <p>Semilla actual: {existing ? findPiece(existing)?.subtitleName : 'Sin asignar'}</p>
        <label>Semilla<select value={slug} disabled={saving} onChange={e => { setSlug(e.target.value); setConfirmed(false); setNotice('') }}>
          <option value="">Selecciona una semilla</option>
          {elements.map(p => <option key={p.slug} value={p.slug}>{p.number}. {p.subtitleName || p.title}</option>)}
        </select></label>
        {existing && existing !== slug && <label className="nfc-confirm"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />Cambiar la semilla asignada a esta tarjeta.</label>}
        <button disabled={!ready || saving || !slug || (existing && existing !== slug && !confirmed)} onClick={save}>{saving ? 'Guardando…' : 'Guardar asociación'}</button>
      </section> : <p>Esperando una tarjeta…</p>}
      <section>
        <h2>Tarjetas asignadas: {Object.keys(tags).length}</h2>
        <ul>{Object.entries(tags).map(([uid, seed]) => <li key={uid}>{uid} → {findPiece(seed)?.subtitleName || seed}</li>)}</ul>
        <button disabled={!ready} onClick={exportBackup}>Exportar copia de las asociaciones</button>
        <p>Las asociaciones se guardan en: {storagePath}</p>
      </section>
      <label>Probar una ficha<select value="" onChange={e => { if (e.target.value) { setPiece({slug:e.target.value,token:Date.now()}); setMode('view') } }}>
        <option value="">Selecciona una semilla para verla</option>
        {elements.map(p => <option key={p.slug} value={p.slug}>{p.number}. {p.subtitleName || p.title}</option>)}
      </select></label>
    </>}
    {notice && <p role="status">{notice}</p>}
    {error && <p role="alert">{error}</p>}
    <p>Ctrl + Mayús + A: cambiar entre la pantalla de semillas y la asignación de tarjetas. F11: pantalla completa.</p>
  </main>
}
