import { restoreResource, spendResource } from '../core/resources'
import type { Character, Resource } from '../core/types'
import { useCombat } from '../store/combatStore'
import { rechargeLabel } from './labels'

function Pips({ resource }: { resource: Resource }) {
  if (resource.max > 10) {
    return (
      <span className="pips__count">
        {resource.current}/{resource.max}
      </span>
    )
  }
  return (
    <span className="pips" aria-label={`${resource.current} de ${resource.max}`}>
      {Array.from({ length: resource.max }, (_, i) => (
        <span key={i} className={`pip ${i < resource.current ? 'pip--on' : ''}`} />
      ))}
    </span>
  )
}

export function ResourceList({ character }: { character: Character }) {
  const apply = useCombat((s) => s.apply)

  return (
    <section className="card">
      <h2>Recursos</h2>
      <ul className="resources">
        {character.resources.map((r) => (
          <li key={r.id} className="resource">
            <div className="resource__info">
              <span className="resource__name">{r.name}</span>
              <span className="resource__recharge">{rechargeLabel[r.recharge]}</span>
            </div>
            <Pips resource={r} />
            <div className="resource__controls">
              <button
                className="btn btn--icon"
                aria-label={`Gastar ${r.name}`}
                disabled={r.current <= 0}
                onClick={() => apply(`Gasta 1 de ${r.name}`, (c) => spendResource(c, r.id))}
              >
                −
              </button>
              <button
                className="btn btn--icon"
                aria-label={`Recuperar ${r.name}`}
                disabled={r.current >= r.max}
                onClick={() => apply(`Recupera 1 de ${r.name}`, (c) => restoreResource(c, r.id))}
              >
                +
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
