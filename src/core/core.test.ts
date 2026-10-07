import { describe, expect, it } from 'vitest'
import { exampleFighter5 } from './examples'
import { getResource, longRest, shortRest } from './resources'
import { attack, move, startTurn, useFeature } from './turn'
import type { Character, Feature, Result } from './types'

/** Ayuda para los tests: si falla, el test se rompe con el mensaje. */
function must(result: Result): Character {
  if (!result.ok) throw new Error(result.error)
  return result.character
}

const feature = (c: Character, id: string): Feature => {
  const f = c.features.find((x) => x.id === id)
  if (!f) throw new Error(`falta ${id}`)
  return f
}

describe('Ataque Adicional', () => {
  it('permite 2 ataques con una acción a nivel 5', () => {
    let c = exampleFighter5()
    c = must(attack(c))
    expect(c.turn.actionAvailable).toBe(false)
    expect(c.turn.attacksRemaining).toBe(1)
    c = must(attack(c))
    expect(c.turn.attacksRemaining).toBe(0)
    expect(attack(c).ok).toBe(false)
  })

  it('Oleada de Acción da otra acción con 2 ataques más', () => {
    let c = exampleFighter5()
    c = must(attack(c))
    c = must(attack(c))
    c = must(useFeature(c, feature(c, 'action-surge')))
    c = must(attack(c))
    c = must(attack(c))
    expect(attack(c).ok).toBe(false)
    expect(getResource(c, 'action-surge')?.current).toBe(0)
  })
})

describe('Economía de acciones', () => {
  it('no deja usar dos acciones adicionales', () => {
    let c = exampleFighter5()
    c = must(useFeature(c, feature(c, 'second-wind')))
    const again = useFeature(c, feature(c, 'second-wind'))
    expect(again.ok).toBe(false)
  })

  it('no gasta el recurso si falla el costo de acción', () => {
    let c = exampleFighter5()
    c = must(attack(c)) // gasta la acción
    const before = getResource(c, 'action-surge')?.current
    // Correr cuesta acción → debe fallar sin tocar nada
    expect(useFeature(c, feature(c, 'dash')).ok).toBe(false)
    expect(getResource(c, 'action-surge')?.current).toBe(before)
  })

  it('Correr duplica el movimiento', () => {
    let c = exampleFighter5()
    c = must(useFeature(c, feature(c, 'dash')))
    expect(c.turn.movementRemaining).toBe(60)
    c = must(move(c, 45))
    expect(c.turn.movementRemaining).toBe(15)
    expect(move(c, 20).ok).toBe(false)
  })

  it('el nuevo turno renueva todo y avanza la ronda', () => {
    let c = exampleFighter5()
    c = must(attack(c))
    c = must(move(c, 30))
    c = startTurn(c)
    expect(c.turn.round).toBe(2)
    expect(c.turn.actionAvailable).toBe(true)
    expect(c.turn.movementRemaining).toBe(30)
  })
})

describe('Descansos', () => {
  it('descanso corto recarga Oleada de Acción pero no Tomar Aliento', () => {
    let c = exampleFighter5()
    c = must(useFeature(c, feature(c, 'action-surge')))
    c = must(useFeature(c, feature(c, 'second-wind')))
    c = shortRest(c)
    expect(getResource(c, 'action-surge')?.current).toBe(1)
    expect(getResource(c, 'second-wind')?.current).toBe(1)
  })

  it('descanso largo recupera la mitad de los dados de golpe y cura', () => {
    let c = exampleFighter5()
    c = {
      ...c,
      hp: { ...c.hp, current: 10, temp: 5 },
      resources: c.resources.map((r) => (r.id === 'hit-dice' ? { ...r, current: 0 } : r)),
    }
    c = longRest(c)
    expect(getResource(c, 'hit-dice')?.current).toBe(2)
    expect(c.hp).toEqual({ current: 44, max: 44, temp: 0 })
  })
})
