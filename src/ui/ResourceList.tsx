import { restoreResource, spendResource } from '../core/resources'
import { spentThisCombat } from '../core/turn'
import type { Character, Resource } from '../core/types'
import { useCombat } from '../store/combatStore'
import { groupItems } from './groups'
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
  const groups = groupItems(character.resources)

  return (
    <section className="card">
      <h2>Recursos</h2>
      {!character.combatStart && (
        <p className="hint resources__hint">Pulsa «Nuevo combate» al empezar una pelea para ver aquí lo que gastas en ella.</p>
      )}
      {groups.map((g) => {
        const current = g.items.reduce((n, r) => n + r.current, 0)
        const max = g.items.reduce((n, r) => n + r.max, 0)
        const spent = g.items.reduce((n, r) => n + spentThisCombat(character, r.id), 0)
        return (
          // El primer grupo queda abierto; el resto se despliega al tocarlo.
          <details key={g.name} className="group" open={g === groups[0] || undefined}>
            <summary className="group__head">
              <span className="group__name">{g.name}</span>
              {spent > 0 && (
                <span className="spent" title="Gastado en este combate">
                  −{spent}
                </span>
              )}
              <span className="group__count">
                {current}/{max}
              </span>
            </summary>
            <ul className="resources">
              {g.items.map((r) => {
                const used = spentThisCombat(character, r.id)
                return (
                  <li
                    key={r.id}
                    className={`resource ${r.current === 0 ? 'resource--empty' : ''} ${used > 0 ? 'resource--spent' : ''}`}
                  >
                    <div className="resource__info">
                      <span className="resource__name">{r.name}</span>
                      <span className="resource__recharge">
                        {rechargeLabel[r.recharge]}
                        {used > 0 && <span className="spent spent--inline"> · −{used} en este combate</span>}
                      </span>
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
                )
              })}
            </ul>
          </details>
        )
      })}
    </section>
  )
}
