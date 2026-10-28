import { describe, expect, it } from 'vitest'
import { groupItems, normalize } from './groups'

describe('groupItems', () => {
  it('agrupa en orden de aparición y manda lo que no tiene grupo a "General"', () => {
    const items = [{ id: 'a', group: 'Conjuros' }, { id: 'b' }, { id: 'c', group: 'Conjuros' }, { id: 'd', group: '  ' }]
    const groups = groupItems(items)
    expect(groups.map((g) => g.name)).toEqual(['Conjuros', 'General'])
    expect(groups[0].items.map((i) => i.id)).toEqual(['a', 'c'])
    expect(groups[1].items.map((i) => i.id)).toEqual(['b', 'd'])
  })
})

describe('normalize', () => {
  it('ignora mayúsculas y tildes', () => {
    expect(normalize('Acción Súbita')).toBe('accion subita')
  })
})
