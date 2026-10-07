import { newId } from './id'
import type { ActiveEffect, Character } from './types'

/** Estados del SRD para añadir rápido. */
export const CONDITIONS = [
  'Agarrado',
  'Apresado',
  'Asustado',
  'Aturdido',
  'Cegado',
  'Derribado',
  'Ensordecido',
  'Envenenado',
  'Hechizado',
  'Incapacitado',
  'Inconsciente',
  'Invisible',
  'Paralizado',
  'Petrificado',
  'Agotamiento',
]

export function addEffect(character: Character, effect: Omit<ActiveEffect, 'id'>): Character {
  return { ...character, effects: [...character.effects, { ...effect, id: newId() }] }
}

export function removeEffect(character: Character, id: string): Character {
  const target = character.effects.find((e) => e.id === id)
  const effects = character.effects.filter((e) => e.id !== id)
  // Quitar a mano el efecto de concentración también termina la concentración.
  const stillConcentrating = effects.some((e) => e.concentration)
  return {
    ...character,
    effects,
    concentratingOn: target?.concentration && !stillConcentrating ? null : character.concentratingOn,
  }
}

/** Pierde la concentración y quita los efectos que dependían de ella. */
export function endConcentration(character: Character): Character {
  return {
    ...character,
    concentratingOn: null,
    effects: character.effects.filter((e) => !e.concentration),
  }
}

/** Descuenta una ronda a cada efecto con duración. Devuelve los que terminaron. */
export function tickEffects(character: Character): { character: Character; expired: string[] } {
  const expired: string[] = []
  let lostConcentration = false
  const effects = character.effects.flatMap((e) => {
    if (e.roundsLeft === null) return [e]
    const roundsLeft = e.roundsLeft - 1
    if (roundsLeft <= 0) {
      expired.push(e.name)
      if (e.concentration) lostConcentration = true
      return []
    }
    return [{ ...e, roundsLeft }]
  })
  return {
    character: { ...character, effects, concentratingOn: lostConcentration ? null : character.concentratingOn },
    expired,
  }
}
