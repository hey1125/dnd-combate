import { describe, expect, it } from 'vitest'
import { exampleFighter5 } from './examples'
import { validateCharacter } from './schema'
import { spendResource } from './resources'
import { spentThisCombat, startCombat } from './turn'

describe('lo gastado en el combate', () => {
  it('cuenta desde que empezó el combate', () => {
    const before = exampleFighter5()
    expect(spentThisCombat(before, 'hit-dice')).toBe(0)

    let c = startCombat(before)
    const r = spendResource(c, 'hit-dice', 2)
    if (!r.ok) throw new Error(r.error)
    c = r.character
    expect(spentThisCombat(c, 'hit-dice')).toBe(2)
    expect(spentThisCombat(c, 'action-surge')).toBe(0)

    // Un combate nuevo vuelve a contar desde cero.
    expect(spentThisCombat(startCombat(c), 'hit-dice')).toBe(0)
  })

  it('se guarda y carga con el personaje', () => {
    const c = startCombat(exampleFighter5())
    const v = validateCharacter(JSON.parse(JSON.stringify(c)))
    expect(v.ok && v.character.combatStart).toEqual(c.combatStart)
  })
})
