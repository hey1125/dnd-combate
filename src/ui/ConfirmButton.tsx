import { useEffect, useState, type ReactNode } from 'react'

const TIMEOUT_MS = 4000

/**
 * Botón de dos pasos para acciones que cambian mucho: el primer clic pide confirmación
 * y el segundo la ejecuta. Si no confirmas en unos segundos, vuelve a su estado normal.
 */
export function ConfirmButton({
  children,
  confirmLabel,
  onConfirm,
  className = 'btn',
}: {
  children: ReactNode
  confirmLabel: string
  onConfirm: () => void
  className?: string
}) {
  const [armed, setArmed] = useState(false)

  useEffect(() => {
    if (!armed) return
    const t = setTimeout(() => setArmed(false), TIMEOUT_MS)
    return () => clearTimeout(t)
  }, [armed])

  return (
    <button
      className={`${className} ${armed ? 'btn--confirm' : ''}`}
      aria-live="polite"
      onClick={() => {
        if (armed) {
          setArmed(false)
          onConfirm()
        } else setArmed(true)
      }}
      onBlur={() => setArmed(false)}
    >
      {armed ? confirmLabel : children}
    </button>
  )
}
