import { useState } from 'react'
import { attack, move, spendCost } from '../core/turn'
import type { ActionCost, Character } from '../core/types'
import { useCombat } from '../store/combatStore'

/** Casilla de acción, adicional o reacción: un clic la marca como usada (para cosas que no son un rasgo). */
function Slot({
  label,
  available,
  detail,
  onUse,
}: {
  label: string
  available: boolean
  detail?: string
  onUse?: () => void
}) {
  const state = detail ?? (available ? 'Disponible' : 'Usada')
  const className = `slot ${available ? 'slot--on' : 'slot--off'}`
  if (!onUse) {
    return (
      <div className={className}>
        <span className="slot__label">{label}</span>
        <span className="slot__state">{state}</span>
      </div>
    )
  }
  return (
    <button
      className={`${className} slot--button`}
      disabled={!available}
      title={available ? `Marcar ${label.toLowerCase()} como usada` : undefined}
      onClick={onUse}
    >
      <span className="slot__label">{label}</span>
      <span className="slot__state">{available ? `${state} · usar` : state}</span>
    </button>
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
  const use = (cost: ActionCost, text: string) => () => apply(text, (c) => spendCost(c, cost))

  return (
    <section className="card">
      <h2>Turno</h2>
      <div className="slots">
        <Slot
          label="Acción"
          available={t.actionAvailable || t.attacksRemaining > 0}
          detail={t.attacksRemaining > 0 ? `${t.attacksRemaining} ataque${t.attacksRemaining > 1 ? 's' : ''}` : undefined}
          // Con ataques pendientes la acción ya está gastada: la casilla solo informa.
          onUse={t.attacksRemaining > 0 ? undefined : use('action', 'Usa su acción')}
        />
        <Slot label="Adicional" available={t.bonusActionAvailable} onUse={use('bonusAction', 'Usa su acción adicional')} />
        <Slot label="Reacción" available={t.reactionAvailable} onUse={use('reaction', 'Usa su reacción')} />
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
      {!attackCheck.ok && <p className="hint hint--warn">{attackCheck.error}</p>}

      <div className="move" role="group" aria-label="Moverse">
        <span className="move__label">Mover</span>
        {[5, 10, 15, 30].map((n) => (
          <button key={n} className="btn btn--small" disabled={n > t.movementRemaining} onClick={() => doMove(n)}>
            {n}
          </button>
        ))}
        <input
          type="number"
          min={1}
          inputMode="numeric"
          placeholder="pies"
          aria-label="Pies a moverse"
          title="Escribe los pies y pulsa Enter"
          value={feet}
          onChange={(e) => setFeet(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && doMove(Number(feet))}
        />
      </div>
      <p className="hint">Toca una casilla para gastarla en algo que no está en tu lista (por ejemplo, Esquivar).</p>
    </section>
  )
}
