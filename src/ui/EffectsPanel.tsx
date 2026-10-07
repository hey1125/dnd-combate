import { useState } from 'react'
import { CONDITIONS, addEffect, removeEffect } from '../core/effects'
import type { Character } from '../core/types'
import { useCombat } from '../store/combatStore'

export function EffectsPanel({ character }: { character: Character }) {
  const apply = useCombat((s) => s.apply)
  const [name, setName] = useState('')
  const [rounds, setRounds] = useState('')

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

      <div className="row">
        <input
          list="conditions"
          placeholder="Estado (ej. Envenenado)"
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
