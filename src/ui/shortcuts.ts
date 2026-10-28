import { useEffect, useRef } from 'react'

export type ShortcutAction = 'nextTurn' | 'undo' | 'search'

type KeyLike = {
  key: string
  ctrlKey: boolean
  metaKey: boolean
  altKey: boolean
  repeat: boolean
  /** Si el foco está en un campo de texto, una lista desplegable o similar. */
  typing: boolean
}

/** Traduce una tecla a un atajo, o null si no es ninguno. Separado del DOM para poder probarlo. */
export function shortcutFor(e: KeyLike): ShortcutAction | null {
  // Mientras escribes, las teclas son del campo (Ctrl+Z deshace el texto, no el combate).
  if (e.typing || e.repeat || e.altKey) return null
  const mod = e.ctrlKey || e.metaKey
  const key = e.key.toLowerCase()
  if (mod && key === 'z') return 'undo'
  if (mod) return null // no pisar Ctrl+N (ventana nueva) ni otros atajos del navegador
  if (key === 'n') return 'nextTurn'
  if (key === '/') return 'search'
  return null
}

export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  return ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

/** Escucha el teclado mientras el componente está montado. */
export function useShortcuts(handlers: Record<ShortcutAction, () => void>) {
  // Ref para no volver a registrar el listener en cada render.
  const ref = useRef(handlers)
  useEffect(() => {
    ref.current = handlers
  })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const action = shortcutFor({
        key: e.key,
        ctrlKey: e.ctrlKey,
        metaKey: e.metaKey,
        altKey: e.altKey,
        repeat: e.repeat,
        typing: isTypingTarget(e.target),
      })
      if (!action) return
      e.preventDefault() // que "/" no abra la búsqueda rápida de Firefox
      ref.current[action]()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}

export const SEARCH_INPUT_ID = 'feature-search'
