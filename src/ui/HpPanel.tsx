import { useState } from 'react'
import { heal, setTempHp } from '../core/hp'
import { dropConcentration } from '../core/turn'
import type { Character } from '../core/types'
import { useCombat } from '../store/combatStore'

export function HpPanel({ character }: { character: Character }) {
  const apply = useCombat((s) => s.apply)
  const damage = useCombat((s) => s.damage)
  const [value, setValue] = useState('')
  const { hp } = character
  const n = Number(value)
  const valid = Number.isFinite(n) && n > 0
  const pct = Math.round((hp.current / hp.max) * 100)
  const level = pct > 50 ? 'ok' : pct > 25 ? 'warn' : 'bad'

  const run = (fn: () => void) => {
    if (!valid) return
    fn()
    setValue('')
  }

  return (
    <section className="card">
      <div className="hp__header">
        <h2>Puntos de golpe</h2>
        <span className="hp__numbers">
          {hp.current}/{hp.max}
          {hp.temp > 0 && <span className="hp__temp"> +{hp.temp} temp</span>}
        </span>
      </div>
      <div className="bar">
        <div className={`bar__fill bar__fill--${level}`} style={{ width: `${pct}%` }} />
      </div>

      <div className="row">
        <input
          type="number"
          min={1}
          inputMode="numeric"
          placeholder="Cantidad"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button className="btn btn--danger" disabled={!valid} onClick={() => run(() => damage(n))}>
          Daño
        </button>
        <button className="btn btn--heal" disabled={!valid} onClick={() => run(() => apply(`Se cura ${n}`, (c) => heal(c, n)))}>
          Curar
        </button>
        <button className="btn" disabled={!valid} onClick={() => run(() => apply(`Gana ${n} PG temporales`, (c) => setTempHp(c, n)))}>
          Temp
        </button>
      </div>

      {character.concentratingOn && (
        <div className="concentration">
          <span>
            Concentrado en <strong>{character.concentratingOn}</strong>
          </span>
          <button className="btn btn--small" onClick={() => apply('Pierde la concentración', dropConcentration)}>
            Terminar
          </button>
        </div>
      )}
    </section>
  )
}
