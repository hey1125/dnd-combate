import { describe, expect, it } from 'vitest'
import { exampleFighter5 } from './examples'
import { mergeCharacter } from './io'

describe('mergeCharacter', () => {
  it('trae la ficha nueva y conserva el estado de la sesión', () => {
    const existing = exampleFighter5()
    existing.hp = { current: 20, max: 44, temp: 5 }
    existing.resources = existing.resources.map((r) => (r.id === 'action-surge' ? { ...r, current: 0 } : r))
    existing.effects = [{ id: 'e', name: 'Derribado', roundsLeft: null }]
    existing.turn = { ...existing.turn, round: 3, actionAvailable: false }

    const incoming = exampleFighter5()
    incoming.hp = { current: 52, max: 52, temp: 0 }
    incoming.resources = [
      ...incoming.resources,
      { id: 'nuevo', name: 'Nuevo', max: 2, current: 2, recharge: 'longRest' },
    ]
    incoming.features = [...incoming.features, { id: 'f', name: 'Rasgo nuevo', cost: 'action' }]

    const m = mergeCharacter(existing, incoming)
    expect(m.hp).toEqual({ current: 20, max: 52, temp: 5 })
    expect(m.resources.find((r) => r.id === 'action-surge')?.current).toBe(0)
    expect(m.resources.find((r) => r.id === 'nuevo')?.current).toBe(2)
    expect(m.features.some((f) => f.name === 'Rasgo nuevo')).toBe(true)
    expect(m.effects.map((e) => e.name)).toEqual(['Derribado'])
    expect(m.turn.round).toBe(3)
    expect(m.turn.actionAvailable).toBe(false)
  })

  it('recorta lo actual si el máximo nuevo es menor y quita recursos que ya no existen', () => {
    const existing = exampleFighter5()
    const incoming = exampleFighter5()
    incoming.hp = { current: 30, max: 30, temp: 0 }
    incoming.resources = [{ id: 'hit-dice', name: 'Dados de Golpe (d10)', max: 3, current: 3, recharge: 'longRest' }]
    const m = mergeCharacter(existing, incoming)
    expect(m.hp.current).toBe(30)
    expect(m.resources).toHaveLength(1)
    expect(m.resources[0].current).toBe(3)
  })

  it('si cambia la velocidad reinicia el movimiento pero no devuelve la acción gastada', () => {
    const existing = exampleFighter5()
    existing.turn = { ...existing.turn, movementRemaining: 0, actionAvailable: false }
    const incoming = { ...exampleFighter5(), speed: 40 }
    const m = mergeCharacter(existing, incoming)
    expect(m.turn.movementRemaining).toBe(40)
    expect(m.turn.actionAvailable).toBe(false)
  })
})
