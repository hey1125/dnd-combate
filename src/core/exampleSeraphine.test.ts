import { describe, expect, it } from 'vitest'
import { exampleSeraphine } from './examples'
import { promptsFor } from './restPrompts'
import { isSpellSlot } from './spells'

describe('ejemplo de Seraphine', () => {
  it('es un personaje válido y completo', () => {
    const c = exampleSeraphine()
    expect(c.name).toBe('Seraphine Delmark')
    expect(c.attacksPerAction).toBe(2)
    expect(c.resources.filter((r) => isSpellSlot(r.id)).map((r) => r.max)).toEqual([4, 2])
    expect(c.features.length).toBeGreaterThan(30)
    expect(c.advantages.length).toBeGreaterThan(0)
    expect(promptsFor(c, 'short').length).toBe(1)
  })

  it('cada rasgo apunta a un recurso que existe', () => {
    const c = exampleSeraphine()
    const ids = new Set(c.resources.map((r) => r.id))
    expect(c.features.filter((f) => f.resourceId && !ids.has(f.resourceId))).toEqual([])
  })
})
