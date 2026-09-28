import { useCallback, useRef, useState } from 'react'

export function useNfc(onRead) {
  const supported = typeof window !== 'undefined' && 'NDEFReader' in window
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const controller = useRef(null)

  const scan = useCallback(async () => {
    if (!supported) {
      setError('Este navegador no es compatible con Web NFC. Prueba Chrome en Android.')
      setStatus('unsupported')
      return
    }
    try {
      setError('')
      setStatus('scanning')
      controller.current = new AbortController()
      const reader = new window.NDEFReader()
      await reader.scan({ signal: controller.current.signal })
      reader.addEventListener('reading', ({ message, serialNumber }) => {
        let value = ''
        for (const record of message.records) {
          if (record.recordType === 'text') {
            value = new TextDecoder(record.encoding || 'utf-8').decode(record.data)
            break
          }
          if (record.recordType === 'url') {
            value = new TextDecoder().decode(record.data)
            break
          }
        }
        setStatus('success')
        onRead({ value, serialNumber, timestamp: new Date().toISOString() })
        controller.current?.abort()
      }, { once: true })
      reader.addEventListener('readingerror', () => {
        setStatus('error')
        setError('No se ha podido leer la tarjeta. Acércala de nuevo.')
      }, { once: true })
    } catch (err) {
      if (err.name !== 'AbortError') {
        setStatus('error')
        setError(err.name === 'NotAllowedError' ? 'Necesitamos permiso para acceder al NFC.' : 'No se pudo iniciar la lectura NFC.')
      }
    }
  }, [onRead, supported])

  const stop = useCallback(() => {
    controller.current?.abort()
    setStatus('idle')
  }, [])

  const write = useCallback(async (value) => {
    if (!supported) throw new Error('Web NFC no está disponible en este navegador.')
    const writer = new window.NDEFReader()
    await writer.write({ records: [{ recordType: 'text', data: value, lang: 'es' }] })
  }, [supported])

  return { supported, status, error, scan, stop, write }
}
