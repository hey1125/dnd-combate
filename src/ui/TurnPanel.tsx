import { useState } from 'react'
import { attack, move, spendCost } from '../core/turn'
import type { Character } from '../core/types'
import { useCombat } from '../store/combatStore'

function Slot({ label, available, detail }: { label: string; available: boolean; detail?: string }) {
  return (
    <div className={`slot ${available ? 'slot--on' : 'slot--off'}`}>
      <span className="slot__label">{label}</span>
      <span className="slot__state">{detail ?? (available ? 'Disponible' : 'Usada')}</span>
    </div>
  )
}

export function TurnPanel({ character }: { character: Character }) {
  const apply = useCombat((s) => s.apply)
  const [feet, setFeet] = useState('')
  const t = character.turn

  const attackCheck = attack(character)
  const attackLabel =
    t.attacksRemaining > 0
      ? `Atacar (queda${t.attacksRemaining > 1 ? 'n' : ''} ${t.attacksRemaining})`
      : `Atacar${character.attacksPerAction > 1 ? ` (${character.attacksPerAction} ataques)` : ''}`

  const doMove = (n: number) => {
    if (!Number.isFinite(n) || n <= 0) return
    apply(`Se mueve ${n} pies`, (c) => move(c, n))
    setFeet('')
  }

  return (
    <section className="card">
      <h2>Turno</h2>
      <div className="slots">
        <Slot
          label="Acción"
          available={t.actionAvailable || t.attacksRemaining > 0}
          detail={t.attacksRemaining > 0 ? `${t.attacksRemaining} ataque${t.attacksRemaining > 1 ? 's' : ''}` : undefined}
        />
        <Slot label="Adicional" available={t.bonusActionAvailable} />
        <Slot label="Reacción" available={t.reactionAvailable} />
        <Slot label="Movimiento" available={t.movementRemaining > 0} detail={`${t.movementRemaining} pies`} />
      </div>

      <button
        className="btn btn--primary btn--big"
        disabled={!attackCheck.ok}
        title={attackCheck.ok ? undefined : attackCheck.error}
        onClick={() => apply('Ataca', attack)}
      >
        {attackLabel}
      </button>

      <div className="row">
        <button className="btn" disabled={!t.actionAvailable} onClick={() => apply('Usa su acción', (c) => spendCost(c, 'action'))}>
          Otra acción
        </button>
        <button className="btn" disabled={!t.bonusActionAvailable} onClick={() => apply('Usa su acción adicional', (c) => spendCost(c, 'bonusAction'))}>
          Otra adicional
        </button>
        <button className="btn" disabled={!t.reactionAvailable} onClick={() => apply('Usa su reacción', (c) => spendCost(c, 'reaction'))}>
          Otra reacción
        </button>
      </div>

      <div className="row move">
        {[5, 10, 15, 30].map((n) => (
          <button key={n} className="btn btn--small" disabled={n > t.movementRemaining} onClick={() => doMove(n)}>
            −{n}
          </button>
        ))}
        <input
          type="number"
          min={1}
          inputMode="numeric"
          placeholder="pies"
          value={feet}
          onChange={(e) => setFeet(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && doMove(Number(feet))}
        />
        <button className="btn btn--small" onClick={() => doMove(Number(feet))}>
          Mover
        </button>
      </div>
    </section>
  )
}
