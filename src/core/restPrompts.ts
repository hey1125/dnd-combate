import { addEffect } from './effects'
import type { Character, RestPrompt } from './types'

export type RestKind = 'short' | 'long'

/** Recordatorios que tocan tras este tipo de descanso. */
export function promptsFor(character: Character, kind: RestKind): RestPrompt[] {
  return character.restPrompts.filter((p) => p.after === 'both' || p.after === kind)
}

/**
 * Aplica la respuesta elegida: quita el estado que dejó la respuesta anterior de este mismo
 * recordatorio y añade el nuevo, si la respuesta trae uno.
 */
export function answerPrompt(character: Character, promptId: string, optionIndex: number): Character {
  const prompt = character.restPrompts.find((p) => p.id === promptId)
  const option = prompt?.options[optionIndex]
  if (!prompt || !option) return character
  const cleared = { ...character, effects: character.effects.filter((e) => e.promptId !== promptId) }
  if (!option.effect) return cleared
  return addEffect(cleared, { name: option.effect.name, roundsLeft: null, rules: option.effect.rules, promptId })
}
