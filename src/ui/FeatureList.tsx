import { useState } from 'react'
import { getResource } from '../core/resources'
import { castOptions, slotLevel } from '../core/spells'
import { applyFeature } from '../core/turn'
import type { Character, Feature } from '../core/types'
import { useCombat } from '../store/combatStore'
import { costLabel } from './labels'

export function FeatureList({ character }: { character: Character }) {
  const apply = useCombat((s) => s.apply)
  const [choosing, setChoosing] = useState<string | null>(null)

  if (character.features.length === 0) return null

  const use = (f: Feature, slotId?: string) => {
    const level = slotLevel(slotId)
    const label = level !== null && slotId !== f.resourceId ? `Usa ${f.name} (nivel ${level})` : `Usa ${f.name}`
    apply(label, (c) => applyFeature(c, f, { slotId }))
    setChoosing(null)
  }

  return (
    <section className="card">
      <h2>Rasgos y conjuros</h2>
      <div className="features">
        {character.features.map((f) => {
          const check = applyFeature(character, f)
          const options = f.upcast ? castOptions(character, f) : []
          // Se puede subir de nivel si hay algún espacio superior disponible, aunque el base esté agotado.
          const canUpcast = options.length > 0 && applyFeature(character, f, { slotId: options[0].id }).ok
          const enabled = check.ok || canUpcast
          const res = f.resourceId ? getResource(character, f.resourceId) : undefined
          const base = slotLevel(f.resourceId)

          return (
            <div key={f.id} className="feature-wrap">
              <button
                className="btn feature"
                disabled={!enabled}
                title={enabled ? undefined : check.ok ? undefined : check.error}
                aria-expanded={f.upcast ? choosing === f.id : undefined}
                onClick={() => (f.upcast && options.length > 1 ? setChoosing(choosing === f.id ? null : f.id) : use(f, options[0]?.id))}
              >
                <span className="feature__name">
                  {f.name}
                  {base !== null && <span className="feature__level"> · nv {base}{f.upcast ? '+' : ''}</span>}
                </span>
                <span className="feature__meta">
                  {f.durationRounds && <span className="tag">{f.durationRounds} r</span>}
                  {f.concentration && <span className="tag">Conc.</span>}
                  <span className={`tag tag--${f.cost}`}>{costLabel[f.cost]}</span>
                  {res && (
                    <span className="feature__uses">
                      {res.current}/{res.max}
                    </span>
                  )}
                </span>
              </button>

              {choosing === f.id && (
                <div className="slot-picker" role="group" aria-label={`Elegir espacio para ${f.name}`}>
                  <span className="muted">Lanzar con espacio de:</span>
                  {options.map((r) => (
                    <button key={r.id} className="btn btn--small" onClick={() => use(f, r.id)}>
                      Nv {slotLevel(r.id)} <span className="muted">({r.current})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
