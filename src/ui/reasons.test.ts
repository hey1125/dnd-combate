import { describe, expect, it } from 'vitest'
import { exampleFighter5 } from '../core/examples'
import type { Character, Feature } from '../core/types'
import { blockedReason } from './reasons'

const base = (): Character => ({
  ...exampleFighter5(),
  resources: [{ id: 'slot-1', name: 'Nv 1', max: 2, current: 0, recharge: 'longRest' }],
})
const spell: Feature = { id: 's', name: 'Escudo', cost: 'reaction', resourceId: 'slot-1' }

describe('blockedReason', () => {
  it('explica la falta de espacios y de acciones', () => {
    const c = base()
    expect(blockedReason(c, spell)).toBe('Sin espacios de nivel 1')
    expect(blockedReason(c, { ...spell, upcast: true })).toBe('Sin espacios de nivel 1 o más')
    expect(blockedReason({ ...c, turn: { ...c.turn, reactionAvailable: false } }, spell)).toBe('Ya usaste tu reacción')
    expect(blockedReason({ ...c, hp: { ...c.hp, current: 0 } }, spell)).toBe('Estás a 0 PG')
  })

  it('no bloquea si se puede lanzar con un espacio superior', () => {
    expect(blockedReason(base(), { ...spell, upcast: true }, true)).toBeNull()
  })
})
