import { isDead, recordDeathSave, revive, type DeathSaveRoll } from '../core/deathSaves'
import type { Character } from '../core/types'
import { useCombat } from '../store/combatStore'

function Boxes({ count, kind }: { count: number; kind: 'success' | 'failure' }) {
  return (
    <span className="ds-boxes" aria-label={`${count} de 3`}>
      {[0, 1, 2].map((i) => (
        <span key={i} className={`ds-box ${i < count ? `ds-box--${kind}` : ''}`} />
      ))}
    </span>
  )
}

const rolls: { roll: DeathSaveRoll; label: string; log: string }[] = [
  { roll: 'success', label: 'Éxito (10+)', log: 'Éxito en salvación contra muerte' },
  { roll: 'failure', label: 'Fallo (1–9)', log: 'Fallo en salvación contra muerte' },
  { roll: 'nat20', label: '20 natural', log: '¡20 natural! Recupera 1 PG' },
  { roll: 'nat1', label: '1 natural', log: '1 natural: dos fallos' },
]

/** Solo aparece con 0 PG. */
export function DeathSavesPanel({ character }: { character: Character }) {
  const apply = useCombat((s) => s.apply)
  if (character.hp.current > 0) return null

  const { successes, failures, stable } = character.deathSaves
  const dead = isDead(character)
  const status = dead ? 'Muerto' : stable ? 'Estable (inconsciente)' : 'Inconsciente: tira al inicio de tu turno'

  return (
    <section className={`card death ${dead ? 'death--dead' : stable ? 'death--stable' : ''}`}>
      <h2>Salvaciones contra muerte</h2>
      <p className="death__status">{status}</p>
      <div className="death__rows">
        <div className="death__row">
          <span>Éxitos</span>
          <Boxes count={successes} kind="success" />
        </div>
        <div className="death__row">
          <span>Fallos</span>
          <Boxes count={failures} kind="failure" />
        </div>
      </div>

      {!dead && !stable && (
        <div className="row">
          {rolls.map((r) => (
            <button key={r.roll} className="btn btn--small" onClick={() => apply(r.log, (c) => recordDeathSave(c, r.roll))}>
              {r.label}
            </button>
          ))}
        </div>
      )}
      {dead && (
        <div className="row">
          <button className="btn btn--small" onClick={() => apply('Revive con 1 PG', revive)}>
            Revivir con 1 PG
          </button>
        </div>
      )}
      {!dead && <p className="hint">Curarte con cualquier cantidad te devuelve la conciencia.</p>}
    </section>
  )
}
