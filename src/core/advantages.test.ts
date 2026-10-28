import { describe, expect, it } from 'vitest'
import { exampleFighter5 } from './examples'
import { validateCharacter } from './schema'

describe('ventajas y defensas', () => {
  it('un personaje guardado antes, sin el campo, carga con la lista vacía', () => {
    const { advantages: _omit, ...old } = exampleFighter5()
    void _omit
    const v = validateCharacter(old)
    expect(v.ok && v.character.advantages).toEqual([])
  })

  it('acepta los cuatro tipos y exige texto', () => {
    const c = exampleFighter5()
    const ok = validateCharacter({
      ...c,
      advantages: [
        { id: 'a', kind: 'advantage', text: 'Salvaciones contra hechizado', source: 'Ancestro feérico' },
        { id: 'b', kind: 'resistance', text: 'Fuego' },
      ],
    })
    expect(ok.ok).toBe(true)
    expect(validateCharacter({ ...c, advantages: [{ id: 'c', kind: 'advantage', text: '  ' }] }).ok).toBe(false)
    expect(validateCharacter({ ...c, advantages: [{ id: 'd', kind: 'otra', text: 'x' }] }).ok).toBe(false)
  })
})
