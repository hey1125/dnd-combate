import { validateCharacter } from './schema'
import { freshTurn } from './turn'
import type { Character } from './types'

// Formato del archivo de respaldo. `version` permite migrar si el formato cambia.
const APP = 'dnd-combate'
const VERSION = 1

export function exportCharacters(characters: Character[]): string {
  return JSON.stringify({ app: APP, version: VERSION, exportedAt: new Date().toISOString(), characters }, null, 2)
}

export type ImportResult =
  | { ok: true; characters: Character[]; skipped: string[] }
  | { ok: false; error: string }

/** Lee un respaldo. Acepta el formato completo, una lista o un solo personaje. */
export function parseImport(text: string): ImportResult {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return { ok: false, error: 'El archivo no es un JSON válido' }
  }

  let list: unknown[]
  if (Array.isArray(data)) list = data
  else if (data && typeof data === 'object' && Array.isArray((data as { characters?: unknown }).characters))
    list = (data as { characters: unknown[] }).characters
  else if (data && typeof data === 'object') list = [data]
  else return { ok: false, error: 'El archivo no tiene personajes' }

  const characters: Character[] = []
  const skipped: string[] = []
  list.forEach((item, i) => {
    const v = validateCharacter(item)
    if (v.ok) characters.push(v.character)
    else {
      const name = (item as { name?: unknown })?.name
      skipped.push(`${typeof name === 'string' && name ? name : `#${i + 1}`}: ${v.errors[0]}`)
    }
  })
  if (characters.length === 0) return { ok: false, error: `Ningún personaje válido. ${skipped[0] ?? ''}`.trim() }
  return { ok: true, characters, skipped }
}

/**
 * Actualiza la ficha con una versión nueva sin perder cómo ibas en la sesión.
 * De `incoming` toma la definición (rasgos, recursos, máximos, ventajas...).
 * De `existing` conserva el estado: PG actuales, usos gastados, efectos, concentración, salvaciones y turno.
 */
export function mergeCharacter(existing: Character, incoming: Character): Character {
  const before = new Map(existing.resources.map((r) => [r.id, r]))
  const resources = incoming.resources.map((r) => {
    const old = before.get(r.id)
    return old ? { ...r, current: Math.min(old.current, r.max) } : r
  })
  const merged: Character = {
    ...incoming,
    resources,
    hp: {
      max: incoming.hp.max,
      current: Math.min(existing.hp.current, incoming.hp.max),
      temp: existing.hp.temp,
    },
    effects: existing.effects,
    concentratingOn: existing.concentratingOn,
    deathSaves: existing.deathSaves,
    combatStart: existing.combatStart,
    notes: existing.notes,
    turn: existing.turn,
  }
  // Si cambió la velocidad, el movimiento que queda en este turno ya no cuadra.
  if (existing.speed !== incoming.speed) merged.turn = { ...freshTurn(merged, existing.turn.round), ...pickSpent(existing) }
  return merged
}

/** Lo ya gastado del turno, para no devolverlo al reiniciar el movimiento. */
function pickSpent(c: Character) {
  const { actionAvailable, bonusActionAvailable, reactionAvailable, attacksRemaining, slotsSpent } = c.turn
  return { actionAvailable, bonusActionAvailable, reactionAvailable, attacksRemaining, slotsSpent }
}
