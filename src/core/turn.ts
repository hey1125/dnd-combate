import { getResource, rechargeResources, spendResource } from './resources'
import type { ActionCost, Character, Feature, Result, TurnState } from './types'

const ok = (character: Character): Result => ({ ok: true, character })
const fail = (error: string): Result => ({ ok: false, error })

export function freshTurn(character: Character, round: number): TurnState {
  return {
    round,
    actionAvailable: true,
    bonusActionAvailable: true,
    reactionAvailable: true,
    movementRemaining: character.speed,
    attacksRemaining: 0,
  }
}

/** Inicio de tu turno: se renuevan acción, acción adicional, reacción, movimiento y recursos "por turno". */
export function startTurn(character: Character): Character {
  const recharged = rechargeResources(character, ['turn'])
  return { ...recharged, turn: freshTurn(recharged, character.turn.round + 1) }
}

/** Inicia un combate nuevo en la ronda 1. */
export function startCombat(character: Character): Character {
  return { ...character, turn: freshTurn(character, 1) }
}

function costName(cost: ActionCost): string {
  switch (cost) {
    case 'action':
      return 'acción'
    case 'bonusAction':
      return 'acción adicional'
    case 'reaction':
      return 'reacción'
    case 'free':
      return 'gratis'
  }
}

/** Gasta la acción, acción adicional o reacción. */
export function spendCost(character: Character, cost: ActionCost): Result {
  const t = character.turn
  switch (cost) {
    case 'action':
      if (!t.actionAvailable) return fail('Ya usaste tu acción')
      return ok({ ...character, turn: { ...t, actionAvailable: false, attacksRemaining: 0 } })
    case 'bonusAction':
      if (!t.bonusActionAvailable) return fail('Ya usaste tu acción adicional')
      return ok({ ...character, turn: { ...t, bonusActionAvailable: false } })
    case 'reaction':
      if (!t.reactionAvailable) return fail('Ya usaste tu reacción')
      return ok({ ...character, turn: { ...t, reactionAvailable: false } })
    case 'free':
      return ok(character)
  }
}

/**
 * Hace un ataque con la acción de Atacar.
 * El primer ataque gasta la acción y abre `attacksPerAction` ataques (Ataque Adicional).
 * Los siguientes consumen de los ataques restantes.
 */
export function attack(character: Character): Result {
  const t = character.turn
  if (t.attacksRemaining > 0) {
    return ok({ ...character, turn: { ...t, attacksRemaining: t.attacksRemaining - 1 } })
  }
  if (!t.actionAvailable) return fail('No te quedan ataques ni acción')
  return ok({
    ...character,
    turn: { ...t, actionAvailable: false, attacksRemaining: character.attacksPerAction - 1 },
  })
}

/** Gasta pies de movimiento. */
export function move(character: Character, feet: number): Result {
  const t = character.turn
  if (feet <= 0) return fail('El movimiento debe ser mayor a 0')
  if (feet > t.movementRemaining) return fail(`Solo te quedan ${t.movementRemaining} pies`)
  return ok({ ...character, turn: { ...t, movementRemaining: t.movementRemaining - feet } })
}

/** Usa un rasgo/conjuro: paga el costo de acción, el recurso y aplica su efecto. */
export function applyFeature(character: Character, feature: Feature): Result {
  // 1. Comprobar todo antes de gastar nada.
  if (feature.resourceId) {
    const resource = getResource(character, feature.resourceId)
    const needed = feature.resourceCost ?? 1
    if (!resource) return fail(`No existe el recurso "${feature.resourceId}"`)
    if (resource.current < needed) return fail(`No te quedan usos de ${resource.name}`)
  }

  // 2. Pagar costo de acción.
  const paid = spendCost(character, feature.cost)
  if (!paid.ok) return fail(`${feature.name}: ${paid.error} (cuesta ${costName(feature.cost)})`)
  let next = paid.character

  // 3. Pagar recurso.
  if (feature.resourceId) {
    const spent = spendResource(next, feature.resourceId, feature.resourceCost ?? 1)
    if (!spent.ok) return spent
    next = spent.character
  }

  // 4. Concentración: un conjuro nuevo reemplaza al anterior.
  if (feature.concentration) next = { ...next, concentratingOn: feature.name }

  // 5. Efecto.
  const effect = feature.effect ?? { kind: 'none' }
  switch (effect.kind) {
    case 'grantAction':
      next = { ...next, turn: { ...next.turn, actionAvailable: true } }
      break
    case 'grantMovement': {
      const extra = effect.amount === 'speed' ? next.speed : effect.amount
      next = { ...next, turn: { ...next.turn, movementRemaining: next.turn.movementRemaining + extra } }
      break
    }
    case 'none':
      break
  }
  return ok(next)
}

/** Termina la concentración (por fallar la salvación o voluntariamente). */
export function dropConcentration(character: Character): Character {
  return { ...character, concentratingOn: null }
}
