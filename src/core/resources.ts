import { NO_DEATH_SAVES } from './deathSaves'
import type { Character, Recharge, Resource, Result } from './types'

const ok = (character: Character): Result => ({ ok: true, character })
const fail = (error: string): Result => ({ ok: false, error })

export function getResource(character: Character, id: string): Resource | undefined {
  return character.resources.find((r) => r.id === id)
}

function replaceResource(character: Character, updated: Resource): Character {
  return {
    ...character,
    resources: character.resources.map((r) => (r.id === updated.id ? updated : r)),
  }
}

/** Gasta `amount` usos de un recurso. Falla si no alcanza. */
export function spendResource(character: Character, id: string, amount = 1): Result {
  const resource = getResource(character, id)
  if (!resource) return fail(`No existe el recurso "${id}"`)
  if (resource.current < amount) return fail(`No te quedan usos de ${resource.name}`)
  return ok(replaceResource(character, { ...resource, current: resource.current - amount }))
}

/** Recupera usos de un recurso sin pasar del máximo (útil para corregir a mano). */
export function restoreResource(character: Character, id: string, amount = 1): Result {
  const resource = getResource(character, id)
  if (!resource) return fail(`No existe el recurso "${id}"`)
  const current = Math.min(resource.max, resource.current + amount)
  return ok(replaceResource(character, { ...resource, current }))
}

function recharged(resource: Resource): Resource {
  const amount = resource.rechargeAmount ?? 'all'
  let gain: number
  if (amount === 'all') gain = resource.max
  else if (amount === 'half') gain = Math.max(1, Math.floor(resource.max / 2))
  else gain = amount
  return { ...resource, current: Math.min(resource.max, resource.current + gain) }
}

/** Recarga todos los recursos cuyo tipo de recarga esté en `which`. */
export function rechargeResources(character: Character, which: Recharge[]): Character {
  return {
    ...character,
    resources: character.resources.map((r) => (which.includes(r.recharge) ? recharged(r) : r)),
  }
}

/** Descanso corto: recarga lo de descanso corto. */
export function shortRest(character: Character): Character {
  return rechargeResources(character, ['shortRest'])
}

/** Descanso largo: recarga todo, cura al máximo, quita PG temporales, concentración y efectos. */
export function longRest(character: Character): Character {
  const rested = rechargeResources(character, ['shortRest', 'longRest'])
  return {
    ...rested,
    hp: { current: rested.hp.max, max: rested.hp.max, temp: 0 },
    concentratingOn: null,
    effects: [],
    deathSaves: NO_DEATH_SAVES,
  }
}
