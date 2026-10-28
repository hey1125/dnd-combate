import { useState } from 'react'
import { heal, setTempHp } from '../core/hp'
import { dropConcentration } from '../core/turn'
import type { Character } from '../core/types'
import { useCombat } from '../store/combatStore'
import { pushRecent } from './recent'

export function HpPanel({ character }: { character: Character }) {
  const apply = useCombat((s) => s.apply)
  const damage = useCombat((s) => s.damage)
  const checks = useCombat((s) => s.concentrationChecks)
  const resolveConcentration = useCombat((s) => s.resolveConcentration)
  const [value, setValue] = useState('')
  // Últimas cantidades usadas, para repetirlas con un clic (duran mientras la pantalla está abierta).
  const [recentDamage, setRecentDamage] = useState<number[]>([])
  const [recentHeal, setRecentHeal] = useState<number[]>([])
  const { hp } = character
  const n = Number(value)
  const valid = Number.isFinite(n) && n > 0
  const pct = Math.round((hp.current / hp.max) * 100)
  const level = pct > 50 ? 'ok' : pct > 25 ? 'warn' : 'bad'

  const doDamage = (amount: number) => {
    damage(amount)
    setRecentDamage((r) => pushRecent(r, amount))
  }
  const doHeal = (amount: number) => {
    apply(`Se cura ${amount}`, (c) => heal(c, amount))
    setRecentHeal((r) => pushRecent(r, amount))
  }

  const run = (fn: (amount: number) => void) => {
    if (!valid) return
    fn(n)
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
          title="Enter = daño · Shift+Enter = curar"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return
            run(e.shiftKey ? doHeal : doDamage)
          }}
        />
        <button className="btn btn--danger" disabled={!valid} onClick={() => run(doDamage)}>
          Daño
        </button>
        <button className="btn btn--heal" disabled={!valid} onClick={() => run(doHeal)}>
          Curar
        </button>
        <button className="btn" disabled={!valid} onClick={() => run((a) => apply(`Gana ${a} PG temporales`, (c) => setTempHp(c, a)))}>
          Temp
        </button>
      </div>

      {(recentDamage.length > 0 || recentHeal.length > 0) && (
        <div className="recent" aria-label="Cantidades recientes">
          {recentDamage.map((a) => (
            <button key={`d${a}`} className="chip chip--damage" title={`Recibir ${a} de daño`} onClick={() => doDamage(a)}>
              −{a}
            </button>
          ))}
          {recentHeal.map((a) => (
            <button key={`h${a}`} className="chip chip--heal" title={`Curar ${a}`} onClick={() => doHeal(a)}>
              +{a}
            </button>
          ))}
        </div>
      )}

      <p className="hint">
        <kbd>Enter</kbd> daño · <kbd>Shift</kbd>+<kbd>Enter</kbd> curar
      </p>

      {character.concentratingOn && (
        <div className={`concentration ${checks.length ? 'concentration--check' : ''}`}>
          <div className="concentration__row">
            <span>
              Concentrado en <strong>{character.concentratingOn}</strong>
            </span>
            <button className="btn btn--small" onClick={() => apply('Pierde la concentración', dropConcentration)}>
              Terminar
            </button>
          </div>
          {checks.length > 0 && (
            <div className="concentration__check" role="group" aria-label="Salvación de concentración">
              <span>
                Salvación de <strong>CON CD {checks[0]}</strong>
                {checks.length > 1 && <span className="muted"> (+{checks.length - 1} más)</span>}
              </span>
              <div className="concentration__buttons">
                <button className="btn btn--small btn--heal" onClick={() => resolveConcentration(true)}>
                  Pasé
                </button>
                <button className="btn btn--small btn--danger" onClick={() => resolveConcentration(false)}>
                  Fallé
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
