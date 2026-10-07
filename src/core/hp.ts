import type { Character } from './types'

/** CD de la salvación de Constitución para mantener la concentración. */
export function concentrationDC(damage: number): number {
  return Math.min(30, Math.max(10, Math.floor(damage / 2)))
}

export type DamageResult = {
  character: Character
  /** Si estaba concentrado, la CD de la salvación que debe hacer. */
  concentrationDC?: number
}

/** Recibe daño: primero se gastan los PG temporales. */
export function takeDamage(character: Character, amount: number): DamageResult {
  if (amount <= 0) return { character }
  const { hp } = character
  const absorbed = Math.min(hp.temp, amount)
  const rest = amount - absorbed
  const next: Character = {
    ...character,
    hp: { ...hp, temp: hp.temp - absorbed, current: Math.max(0, hp.current - rest) },
  }
  return character.concentratingOn
    ? { character: next, concentrationDC: concentrationDC(amount) }
    : { character: next }
}

/** Cura sin pasar del máximo. */
export function heal(character: Character, amount: number): Character {
  if (amount <= 0) return character
  const { hp } = character
  return { ...character, hp: { ...hp, current: Math.min(hp.max, hp.current + amount) } }
}

/** Los PG temporales no se suman: te quedas con el valor más alto. */
export function setTempHp(character: Character, amount: number): Character {
  return { ...character, hp: { ...character.hp, temp: Math.max(character.hp.temp, amount) } }
}
