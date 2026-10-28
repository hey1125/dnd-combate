import { beforeEach, describe, expect, it } from 'vitest'
import { exampleFighter5 } from '../core/examples'
import type { Character, RestPrompt } from '../core/types'
import type { CharacterRepository } from '../data/repository'
import { useCombat } from './combatStore'

const trastorno: RestPrompt = {
  id: 'trastorno',
  question: 'Trastorno',
  after: 'both',
  options: [{ label: 'Voces', effect: { name: 'Voces susurrantes' } }, { label: 'Nada' }],
}

const repoWith = (c: Character): CharacterRepository => {
  const map = new Map([[c.id, c]])
  return {
    list: async () => [...map.values()],
    get: async (id) => map.get(id),
    save: async (x) => void map.set(x.id, x),
    remove: async (id) => void map.delete(id),
  }
}

describe('recordatorios y notas en el store', () => {
  beforeEach(async () => {
    await useCombat.getState().init(repoWith({ ...exampleFighter5(), restPrompts: [trastorno] }))
  })

  it('descansar deja el recordatorio pendiente y responder aplica el estado', () => {
    useCombat.getState().rest('short')
    expect(useCombat.getState().pendingPrompts).toEqual(['trastorno'])
    useCombat.getState().answerRestPrompt('trastorno', 0)
    const s = useCombat.getState()
    expect(s.pendingPrompts).toEqual([])
    expect(s.character?.effects.map((e) => e.name)).toEqual(['Voces susurrantes'])
    expect(s.log[0].text).toBe('Trastorno → Voces')
  })

  it('omitir no cambia nada', () => {
    useCombat.getState().rest('long')
    useCombat.getState().skipRestPrompt('trastorno')
    expect(useCombat.getState().pendingPrompts).toEqual([])
    expect(useCombat.getState().character?.effects).toEqual([])
  })

  it('las notas no entran al historial y deshacer no las borra', () => {
    useCombat.getState().damage(5)
    const historyBefore = useCombat.getState().history.length
    useCombat.getState().setNotes('El ogro tiene 12 PG menos')
    expect(useCombat.getState().history.length).toBe(historyBefore)
    useCombat.getState().undo()
    const s = useCombat.getState()
    expect(s.character?.hp.current).toBe(44)
    expect(s.character?.notes).toBe('El ogro tiene 12 PG menos')
  })
})
