import { addEffect, endConcentration, tickEffects } from './effects'
import { getResource, rechargeResources, spendResource } from './resources'
import { isSpellSlot, slotLevel } from './spells'
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
    slotsSpent: 0,
  }
}

/**
 * Inicio de tu turno: se renuevan acción, acción adicional, reacción, movimiento y recursos "por turno",
 * y se descuenta una ronda a los efectos con duración. Avisa de los que terminaron.
 */
export function startTurn(character: Character): Result {
  const recharged = rechargeResources(character, ['turn'])
  const { character: ticked, expired } = tickEffects(recharged)
  return {
    ok: true,
    character: { ...ticked, turn: freshTurn(ticked, character.turn.round + 1) },
    warning: expired.length ? `Terminó: ${expired.join(', ')}` : undefined,
  }
}

/** Inicia un combate nuevo en la ronda 1 y guarda cómo estaban los recursos, para ver lo gastado en él. */
export function startCombat(character: Character): Character {
  const combatStart = Object.fromEntries(character.resources.map((r) => [r.id, r.current]))
  return { ...character, combatStart, turn: freshTurn(character, 1) }
}

/** Cuánto se gastó de un recurso desde que empezó el combate (0 si no hay combate o si se recuperó). */
export function spentThisCombat(character: Character, resourceId: string): number {
  const start = character.combatStart?.[resourceId]
  const r = character.resources.find((x) => x.id === resourceId)
  if (start === undefined || !r) return 0
  return Math.max(0, start - r.current)
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
  if (character.hp.current === 0) return fail('Estás a 0 PG: no puedes actuar')
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

export type FeatureOptions = {
  /** Espacio de conjuro elegido para lanzarlo a nivel superior. */
  slotId?: string
}

/** Usa un rasgo/conjuro: paga el costo de acción, el recurso y aplica su efecto. */
export function applyFeature(character: Character, feature: Feature, options: FeatureOptions = {}): Result {
  // 0. ¿Qué recurso se gasta? El del rasgo, o el espacio superior elegido.
  let resourceId = feature.resourceId
  if (options.slotId && options.slotId !== feature.resourceId) {
    const base = slotLevel(feature.resourceId)
    const chosen = slotLevel(options.slotId)
    if (base === null || chosen === null) return fail(`${feature.name} no usa espacios de conjuro`)
    if (!feature.upcast) return fail(`${feature.name} no se puede lanzar a nivel superior`)
    if (chosen < base) return fail(`${feature.name} necesita un espacio de nivel ${base} o más`)
    resourceId = options.slotId
  }
  if (character.hp.current === 0) return fail('Estás a 0 PG: no puedes actuar')

  // 1. Comprobar todo antes de gastar nada.
  const needed = feature.resourceCost ?? 1
  if (resourceId) {
    const resource = getResource(character, resourceId)
    if (!resource) return fail(`No existe el recurso "${resourceId}"`)
    if (resource.current < needed) return fail(`No te quedan usos de ${resource.name}`)
  }

  // 2. Pagar costo de acción.
  const paid = spendCost(character, feature.cost)
  if (!paid.ok) return fail(`${feature.name}: ${paid.error} (cuesta ${costName(feature.cost)})`)
  let next = paid.character
  let warning: string | undefined

  // 3. Pagar recurso. Los espacios de conjuro se cuentan por turno (regla 2024: uno por turno).
  if (resourceId) {
    const spent = spendResource(next, resourceId, needed)
    if (!spent.ok) return spent
    next = spent.character
    if (isSpellSlot(resourceId)) {
      if (next.turn.slotsSpent >= 1) warning = 'Ya gastaste un espacio de conjuro este turno (regla 2024: solo uno por turno)'
      next = { ...next, turn: { ...next.turn, slotsSpent: next.turn.slotsSpent + 1 } }
    }
  }

  // 4. Concentración (reemplaza la anterior) y duración.
  const level = slotLevel(resourceId)
  const label = level !== null && level !== slotLevel(feature.resourceId) ? `${feature.name} (nv ${level})` : feature.name
  if (feature.concentration) next = { ...endConcentration(next), concentratingOn: label }
  if (feature.concentration || feature.durationRounds) {
    next = addEffect(next, { name: label, roundsLeft: feature.durationRounds ?? null, concentration: feature.concentration })
  }

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
  return { ok: true, character: next, warning }
}

/** Termina la concentración (por fallar la salvación o voluntariamente). */
export function dropConcentration(character: Character): Character {
  return endConcentration(character)
}
