import { NO_DEATH_SAVES, isDead } from './deathSaves'
import { endConcentration } from './effects'
import type { Character } from './types'

/** CD de la salvación de Constitución para mantener la concentración. */
export function concentrationDC(damage: number): number {
  return Math.min(30, Math.max(10, Math.floor(damage / 2)))
}

export type DamageResult = {
  character: Character
  /** Si estaba concentrado (y sigue consciente), la CD de la salvación que debe hacer. */
  concentrationDC?: number
  /** Avisos: cayó inconsciente, perdió concentración, fallo de salvación, muerte... */
  notes: string[]
}

/** Recibe daño: primero se gastan los PG temporales. Maneja caer a 0 PG y el daño estando a 0. */
export function takeDamage(character: Character, amount: number): DamageResult {
  if (amount <= 0) return { character, notes: [] }
  const { hp } = character
  const notes: string[] = []
  const absorbed = Math.min(hp.temp, amount)
  const rest = amount - absorbed

  // Ya estaba a 0 PG: cada golpe es un fallo de salvación contra muerte.
  if (hp.current === 0) {
    if (isDead(character)) return { character, notes: [] }
    const massive = rest >= hp.max
    const failures = massive ? 3 : Math.min(3, character.deathSaves.failures + 1)
    notes.push(massive ? 'Muerte instantánea por daño masivo' : 'Recibir daño a 0 PG cuenta como un fallo')
    if (failures >= 3 && !massive) notes.push(`${character.name} ha muerto`)
    return {
      character: {
        ...character,
        hp: { ...hp, temp: hp.temp - absorbed },
        deathSaves: { ...character.deathSaves, failures, stable: false },
      },
      notes,
    }
  }

  const current = Math.max(0, hp.current - rest)
  let next: Character = { ...character, hp: { ...hp, temp: hp.temp - absorbed, current } }

  if (current === 0) {
    const overflow = rest - hp.current
    if (overflow >= hp.max) {
      notes.push('Muerte instantánea por daño masivo')
      next = { ...next, deathSaves: { successes: 0, failures: 3, stable: false } }
    } else {
      notes.push(`${character.name} cae inconsciente: empieza a tirar salvaciones contra muerte`)
      next = { ...next, deathSaves: NO_DEATH_SAVES }
    }
    if (character.concentratingOn) {
      notes.push(`Pierde la concentración en ${character.concentratingOn}`)
      next = endConcentration(next)
    }
    return { character: next, notes }
  }

  return character.concentratingOn
    ? { character: next, concentrationDC: concentrationDC(amount), notes }
    : { character: next, notes }
}

/** Cura sin pasar del máximo. Curar desde 0 PG reinicia las salvaciones contra muerte. */
export function heal(character: Character, amount: number): Character {
  if (amount <= 0 || isDead(character)) return character
  const { hp } = character
  return {
    ...character,
    hp: { ...hp, current: Math.min(hp.max, hp.current + amount) },
    deathSaves: hp.current === 0 ? NO_DEATH_SAVES : character.deathSaves,
  }
}

/** Los PG temporales no se suman: te quedas con el valor más alto. */
export function setTempHp(character: Character, amount: number): Character {
  return { ...character, hp: { ...character.hp, temp: Math.max(character.hp.temp, amount) } }
}
