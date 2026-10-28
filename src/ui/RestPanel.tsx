import { useState } from 'react'
import { restPreview } from '../core/resources'
import { startCombat } from '../core/turn'
import type { Character } from '../core/types'
import { useCombat } from '../store/combatStore'
import { ConfirmButton } from './ConfirmButton'

type Kind = 'short' | 'long'

/** Descansos y combate, con una vista previa de lo que recupera cada descanso al pasar el mouse o el foco. */
export function RestPanel({ character }: { character: Character }) {
  const apply = useCombat((s) => s.apply)
  const rest = useCombat((s) => s.rest)
  const [hover, setHover] = useState<Kind | null>(null)
  const preview = hover ? restPreview(character, hover) : null

  const watch = (kind: Kind) => ({
    onMouseEnter: () => setHover(kind),
    onMouseLeave: () => setHover(null),
    onFocus: () => setHover(kind),
    onBlur: () => setHover(null),
  })

  return (
    <section className="card">
      <h2>Descansos y combate</h2>
      <div className="row">
        <span className="rest-wrap" {...watch('short')}>
          <button className="btn" onClick={() => rest('short')}>
            Descanso corto
          </button>
        </span>
        <span className="rest-wrap" {...watch('long')}>
          <ConfirmButton confirmLabel="¿Recargar todo? Confirmar" onConfirm={() => rest('long')}>
            Descanso largo
          </ConfirmButton>
        </span>
        <ConfirmButton confirmLabel="¿Volver a la ronda 1? Confirmar" onConfirm={() => apply('Nuevo combate', startCombat)}>
          Nuevo combate
        </ConfirmButton>
      </div>

      <div className="rest-preview" aria-live="polite">
        {!preview ? (
          <p className="hint">Pasa el mouse por un descanso para ver qué recupera.</p>
        ) : (
          <>
            <p className="rest-preview__title">{hover === 'short' ? 'El descanso corto' : 'El descanso largo'} recupera:</p>
            {preview.resources.length === 0 && preview.hpGain === 0 && preview.effectsCleared === 0 ? (
              <p className="muted">Nada: ya está todo lleno.</p>
            ) : (
              <ul className="rest-preview__list">
                {preview.hpGain > 0 && (
                  <li>
                    <span>Puntos de golpe</span>
                    <span className="rest-preview__gain">
                      {character.hp.current} → {character.hp.max}
                    </span>
                  </li>
                )}
                {preview.resources.map((r) => (
                  <li key={r.id}>
                    <span>{r.name}</span>
                    <span className="rest-preview__gain">
                      {r.from} → {r.to}
                      {r.to < r.max && <span className="muted"> / {r.max}</span>}
                    </span>
                  </li>
                ))}
                {preview.effectsCleared > 0 && (
                  <li>
                    <span>Quita estados y efectos</span>
                    <span className="rest-preview__gain">{preview.effectsCleared}</span>
                  </li>
                )}
              </ul>
            )}
          </>
        )}
      </div>
    </section>
  )
}
