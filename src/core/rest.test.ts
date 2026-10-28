import { describe, expect, it } from 'vitest'
import { addEffect } from './effects'
import { exampleFighter5 } from './examples'
import { restPreview } from './resources'

describe('restPreview', () => {
  const tired = () => {
    let c = exampleFighter5()
    c = { ...c, hp: { ...c.hp, current: 20 }, resources: c.resources.map((r) => ({ ...r, current: 0 })) }
    return addEffect(c, { name: 'Envenenado', roundsLeft: null })
  }

  it('el corto solo muestra lo que recarga en descanso corto', () => {
    const p = restPreview(tired(), 'short')
    expect(p.resources.map((r) => r.id)).toEqual(['action-surge'])
    expect(p.hpGain).toBe(0)
    expect(p.effectsCleared).toBe(0)
  })

  it('el largo muestra recursos, PG y efectos, con la mitad para los dados de golpe', () => {
    const p = restPreview(tired(), 'long')
    expect(p.resources.find((r) => r.id === 'hit-dice')).toMatchObject({ from: 0, to: 2, max: 5 })
    expect(p.hpGain).toBe(24)
    expect(p.effectsCleared).toBe(1)
  })

  it('no lista lo que ya está lleno', () => {
    expect(restPreview(exampleFighter5(), 'long').resources).toEqual([])
  })
})
