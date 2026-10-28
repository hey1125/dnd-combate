import { activeConditionRules, type ConditionRule } from '../core/conditions'
import type { AdvantageKind, Character } from '../core/types'
import { advantageLabel } from './labels'

const ORDER: AdvantageKind[] = ['advantage', 'disadvantage', 'resistance', 'immunity']
const plural: Record<AdvantageKind, string> = {
  advantage: 'Ventaja en',
  disadvantage: 'Desventaja en',
  resistance: 'Resistencia a',
  immunity: 'Inmune a',
}
const ruleLabel: Record<ConditionRule['kind'], string> = {
  ...advantageLabel,
  against: 'Contra ti',
  note: 'Nota',
}

/** Resumen de consulta rápida: con qué tienes ventaja, desventaja, resistencia o inmunidad. */
export function AdvantagesPanel({ character, onEdit }: { character: Character; onEdit: () => void }) {
  const items = character.advantages
  const fromConditions = activeConditionRules(character)

  return (
    <section className="card">
      <h2>Ventajas y defensas</h2>

      {fromConditions.length > 0 && (
        <div className="adv-cond" aria-label="Por tus estados activos">
          {fromConditions.map((c) => (
            <div key={c.name} className="adv-cond__group">
              <h3 className="adv__title adv-cond__title">{c.name}</h3>
              <ul className="adv__list">
                {c.rules.map((r) => (
                  <li key={r.text} className={`adv-cond__item adv-cond__item--${r.kind}`}>
                    <span className={`adv-tag adv-tag--${r.kind}`}>{ruleLabel[r.kind]}</span>
                    <span>{r.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {items.length === 0 ? (
        <p className="muted">
          Nada anotado de forma fija.{' '}
          <button className="btn--link" onClick={onEdit}>
            Añadir en el editor
          </button>
        </p>
      ) : (
        <div className="adv">
          {ORDER.filter((k) => items.some((a) => a.kind === k)).map((kind) => (
            <div key={kind} className={`adv__group adv__group--${kind}`}>
              <h3 className="adv__title">{plural[kind]}</h3>
              <ul className="adv__list">
                {items
                  .filter((a) => a.kind === kind)
                  .map((a) => (
                    <li key={a.id} className="adv__item" title={advantageLabel[kind]}>
                      <span className="adv__text">{a.text}</span>
                      {a.source && <span className="adv__source">{a.source}</span>}
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
