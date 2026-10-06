import { useEffect, useRef, useState } from 'react'
import { readTag, writeTag } from './nfc.js'
export function useNfc() {
  const supported = window.isSecureContext && 'NDEFReader' in window
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const controller = useRef(null)
  useEffect(() => () => controller.current?.abort(), [])
  const run = async (operation, nextStatus) => {
    controller.current?.abort()
    const current = new AbortController()
    controller.current = current
    setError(''); setStatus(nextStatus)
    try {
      if (!supported) throw new Error('Usa Chrome en Android con NFC y abre la web mediante HTTPS.')
      const result = await operation(current.signal)
      if (!current.signal.aborted) setStatus('success')
      return result
    } catch (err) {
      if (current.signal.aborted) return null
      setError(err.name === 'NotAllowedError' ? 'Permite el acceso al NFC para continuar.' : err.message || 'No se ha podido completar la operación NFC.')
      setStatus('error')
      return null
    } finally { current.abort() }
  }
  const scan = () => run(signal => readTag(window.NDEFReader, signal), 'scanning')
  const write = (url, tag) => run(signal => writeTag(window.NDEFReader, url, tag, signal, setStatus), 'checking')
  const stop = () => { controller.current?.abort(); setStatus('idle'); setError('') }
  return { supported, status, error, scan, write, stop }
}
