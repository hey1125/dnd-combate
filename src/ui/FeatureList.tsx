import { getResource } from '../core/resources'
import { applyFeature } from '../core/turn'
import type { Character } from '../core/types'
import { useCombat } from '../store/combatStore'
import { costLabel } from './labels'

export function FeatureList({ character }: { character: Character }) {
  const apply = useCombat((s) => s.apply)

  if (character.features.length === 0) return null

  return (
    <section className="card">
      <h2>Rasgos y conjuros</h2>
      <div className="features">
        {character.features.map((f) => {
          const check = applyFeature(character, f)
          const res = f.resourceId ? getResource(character, f.resourceId) : undefined
          return (
            <button
              key={f.id}
              className="btn feature"
              disabled={!check.ok}
              title={check.ok ? undefined : check.error}
              onClick={() => apply(`Usa ${f.name}`, (c) => applyFeature(c, f))}
            >
              <span className="feature__name">{f.name}</span>
              <span className="feature__meta">
                <span className={`tag tag--${f.cost}`}>{costLabel[f.cost]}</span>
                {res && (
                  <span className="feature__uses">
                    {res.current}/{res.max}
                  </span>
                )}
                {f.concentration && <span className="tag">Conc.</span>}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
