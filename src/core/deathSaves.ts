import type { Character, DeathSaves, Result } from './types'

export const NO_DEATH_SAVES: DeathSaves = { successes: 0, failures: 0, stable: false }

export type DeathSaveRoll = 'success' | 'failure' | 'nat20' | 'nat1'

export const isDead = (c: Character) => c.deathSaves.failures >= 3
export const isDying = (c: Character) => c.hp.current === 0 && !isDead(c) && !c.deathSaves.stable

/** Registra una tirada de salvación contra muerte. */
export function recordDeathSave(character: Character, roll: DeathSaveRoll): Result {
  if (character.hp.current > 0) return { ok: false, error: 'Solo se tiran salvaciones con 0 PG' }
  if (isDead(character)) return { ok: false, error: 'El personaje está muerto' }
  if (character.deathSaves.stable) return { ok: false, error: 'Ya estás estable' }

  const ds = character.deathSaves
  switch (roll) {
    case 'nat20':
      // 20 natural: recupera 1 PG y vuelve en sí.
      return { ok: true, character: { ...character, hp: { ...character.hp, current: 1 }, deathSaves: NO_DEATH_SAVES } }
    case 'success': {
      const successes = Math.min(3, ds.successes + 1)
      const stable = successes >= 3
      return {
        ok: true,
        character: { ...character, deathSaves: { ...ds, successes, stable } },
        warning: stable ? `${character.name} está estable` : undefined,
      }
    }
    case 'failure':
    case 'nat1': {
      const failures = Math.min(3, ds.failures + (roll === 'nat1' ? 2 : 1))
      return {
        ok: true,
        character: { ...character, deathSaves: { ...ds, failures } },
        warning: failures >= 3 ? `${character.name} ha muerto` : undefined,
      }
    }
  }
}

/** Revivir (Revivificar, Resurrección...): vuelve con 1 PG y sin salvaciones. */
export function revive(character: Character): Character {
  return { ...character, hp: { ...character.hp, current: Math.max(1, character.hp.current) }, deathSaves: NO_DEATH_SAVES }
}
