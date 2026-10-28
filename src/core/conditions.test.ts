import { describe, expect, it } from 'vitest'
import { addEffect } from './effects'
import { activeConditionRules, conditionRules } from './conditions'
import { exampleFighter5 } from './examples'

describe('reglas de estados', () => {
  it('reconoce el estado sin importar mayúsculas, tildes ni nivel', () => {
    expect(conditionRules('Derribado').some((r) => r.kind === 'disadvantage')).toBe(true)
    expect(conditionRules('DERRIBADO')).toEqual(conditionRules('derribado'))
    expect(conditionRules('Agotamiento 2').length).toBeGreaterThan(0)
    expect(conditionRules('Heroísmo')).toEqual([])
  })

  it('solo devuelve los estados activos que tienen reglas', () => {
    let c = exampleFighter5()
    c = addEffect(c, { name: 'Envenenado', roundsLeft: null })
    c = addEffect(c, { name: 'Bendecir', roundsLeft: 10 })
    expect(activeConditionRules(c).map((x) => x.name)).toEqual(['Envenenado'])
  })
})
