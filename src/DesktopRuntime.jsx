import { useEffect, useState } from 'react'
import { findPiece } from './data.js'
import IdleScreen from './IdleScreen.jsx'

// Exhibition app: read assigned stickers and display their seeds.
export default function DesktopRuntime({ renderPiece }) {
  const bridge = window.seedDesktop
  const [piece, setPiece] = useState(null)
  useEffect(() => {
    let active = true
    let scan = 0
    const offTag = bridge.onTag(async value => {
      const token = ++scan
      try {
        const state = await bridge.getState()
        if (!active || token !== scan) return
        const slug = state.tags[value.uid]
        setPiece(findPiece(slug) ? { slug, token } : null)
      } catch {
        if (active && token === scan) setPiece(null)
      }
    })
    return () => { active = false; offTag() }
  }, [bridge])
  return piece ? renderPiece(piece.slug, piece.token) : <IdleScreen />
}
