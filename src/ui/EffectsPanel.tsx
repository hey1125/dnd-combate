import { useState } from 'react'
import { CONDITIONS, addEffect, removeEffect } from '../core/effects'
import type { Character } from '../core/types'
import { useCombat } from '../store/combatStore'

/** Los estados que más salen en combate, a un clic (sin duración: se quitan a mano). */
const QUICK = ['Derribado', 'Envenenado', 'Asustado', 'Agarrado', 'Cegado', 'Hechizado']

export function EffectsPanel({ character }: { character: Character }) {
  const apply = useCombat((s) => s.apply)
  const [name, setName] = useState('')
  const [rounds, setRounds] = useState('')

  const active = new Set(character.effects.map((e) => e.name))
  const quick = QUICK.filter((q) => !active.has(q))

  const add = () => {
    const n = name.trim()
    if (!n) return
    const r = Number(rounds)
    const roundsLeft = rounds && Number.isInteger(r) && r > 0 ? r : null
    apply(`Gana el estado ${n}${roundsLeft ? ` (${roundsLeft} rondas)` : ''}`, (c) => addEffect(c, { name: n, roundsLeft }))
    setName('')
    setRounds('')
  }

  return (
    <section className="card">
      <h2>Estados y efectos</h2>
      {character.effects.length === 0 ? (
        <p className="muted">Sin estados activos.</p>
      ) : (
        <ul className="effects">
          {character.effects.map((e) => (
            <li key={e.id} className={`effect ${e.concentration ? 'effect--conc' : ''}`}>
              <span className="effect__name">{e.name}</span>
              <span className="effect__rounds">
                {e.roundsLeft === null ? '∞' : `${e.roundsLeft} ronda${e.roundsLeft === 1 ? '' : 's'}`}
              </span>
              {e.concentration && <span className="tag">Conc.</span>}
              <button
                className="btn btn--icon"
                aria-label={`Quitar ${e.name}`}
                onClick={() => apply(`Termina ${e.name}`, (c) => removeEffect(c, e.id))}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {quick.length > 0 && (
        <div className="recent" aria-label="Estados rápidos">
          {quick.map((q) => (
            <button key={q} className="chip" onClick={() => apply(`Gana el estado ${q}`, (c) => addEffect(c, { name: q, roundsLeft: null }))}>
              + {q}
            </button>
          ))}
        </div>
      )}

      <div className="row effect-add">
        <input
          list="conditions"
          placeholder="Otro estado…"
          aria-label="Nombre del estado"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          className="grow"
        />
        <datalist id="conditions">
          {CONDITIONS.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <input
          type="number"
          min={1}
          inputMode="numeric"
          placeholder="Rondas"
          aria-label="Rondas (vacío = hasta que lo quites)"
          title="Vacío = hasta que lo quites"
          value={rounds}
          onChange={(e) => setRounds(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          className="narrow"
        />
        <button className="btn" disabled={!name.trim()} onClick={add}>
          Añadir
        </button>
      </div>
    </section>
  )
}
