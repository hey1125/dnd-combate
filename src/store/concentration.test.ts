import { beforeEach, describe, expect, it } from 'vitest'
import { applyFeature, dropConcentration } from '../core/turn'
import type { Character, Feature } from '../core/types'
import type { CharacterRepository } from '../data/repository'
import { useCombat } from './combatStore'

// Repositorio en memoria para probar el store sin IndexedDB.
const memory = (): CharacterRepository => {
  const map = new Map<string, Character>()
  return {
    list: async () => [...map.values()],
    get: async (id) => map.get(id),
    save: async (c) => void map.set(c.id, c),
    remove: async (id) => void map.delete(id),
  }
}

const bless: Feature = { id: 'bless', name: 'Bendecir', cost: 'action', concentration: true, durationRounds: 10 }

describe('salvaciones de concentración', () => {
  beforeEach(async () => {
    await useCombat.getState().init(memory())
    const { apply } = useCombat.getState()
    apply('Usa Bendecir', (c) => applyFeature(c, bless))
  })

  it('cada golpe concentrado deja una salvación pendiente con su CD', () => {
    const { damage } = useCombat.getState()
    damage(8)
    damage(30)
    expect(useCombat.getState().concentrationChecks).toEqual([10, 15])
  })

  it('"Pasé" resuelve una y mantiene la concentración', () => {
    const s = useCombat.getState()
    s.damage(8)
    s.damage(30)
    useCombat.getState().resolveConcentration(true)
    expect(useCombat.getState().concentrationChecks).toEqual([15])
    expect(useCombat.getState().character?.concentratingOn).toBe('Bendecir')
  })

  it('"Fallé" termina la concentración, sus efectos y las salvaciones pendientes', () => {
    const s = useCombat.getState()
    s.damage(8)
    s.damage(30)
    useCombat.getState().resolveConcentration(false)
    const after = useCombat.getState()
    expect(after.character?.concentratingOn).toBeNull()
    expect(after.character?.effects).toEqual([])
    expect(after.concentrationChecks).toEqual([])
  })

  it('sin concentración, el daño no pide salvación', () => {
    useCombat.getState().apply('Termina', dropConcentration)
    useCombat.getState().damage(10)
    expect(useCombat.getState().concentrationChecks).toEqual([])
  })

  it('"Pasé" sin salvaciones pendientes no hace nada', () => {
    const before = useCombat.getState().log.length
    useCombat.getState().resolveConcentration(true)
    expect(useCombat.getState().log.length).toBe(before)
  })
})
