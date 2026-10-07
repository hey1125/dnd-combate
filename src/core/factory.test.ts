import { describe, expect, it } from 'vitest'
import { exampleFighter5 } from './examples'
import { applyEdits, fullCasterSlots, newCharacter, newResource } from './factory'
import { validateCharacter } from './schema'

describe('Editor de personaje', () => {
  it('un recurso nuevo empieza lleno', () => {
    const prev = exampleFighter5()
    const draft = { ...prev, resources: [...prev.resources, newResource({ name: 'Ki', max: 5, current: 0 })] }
    const next = applyEdits(prev, draft)
    expect(next.resources.at(-1)?.current).toBe(5)
  })

  it('subir el máximo sube lo actual, bajarlo lo recorta', () => {
    const prev = exampleFighter5() // Tomar Aliento 2/2
    const up = applyEdits(prev, {
      ...prev,
      resources: prev.resources.map((r) => (r.id === 'second-wind' ? { ...r, max: 3 } : r)),
    })
    expect(up.resources.find((r) => r.id === 'second-wind')?.current).toBe(3)
    const down = applyEdits(prev, {
      ...prev,
      resources: prev.resources.map((r) => (r.id === 'second-wind' ? { ...r, max: 1 } : r)),
    })
    expect(down.resources.find((r) => r.id === 'second-wind')?.current).toBe(1)
  })

  it('borrar un recurso desconecta los rasgos que lo usaban', () => {
    const prev = exampleFighter5()
    const draft = { ...prev, resources: prev.resources.filter((r) => r.id !== 'action-surge') }
    const next = applyEdits(prev, draft)
    expect(next.features.find((f) => f.id === 'action-surge')?.resourceId).toBeUndefined()
  })

  it('un personaje nuevo empieza con PG llenos', () => {
    const draft = { ...newCharacter(), hp: { current: 0, max: 30, temp: 0 } }
    expect(applyEdits(null, draft).hp.current).toBe(30)
  })

  it('espacios de conjuro de lanzador completo nivel 5', () => {
    expect(fullCasterSlots(5).map((r) => r.max)).toEqual([4, 3, 2])
    expect(fullCasterSlots(20).map((r) => r.max)).toEqual([4, 3, 3, 3, 3, 2, 2, 1, 1])
  })
})

describe('Validación', () => {
  it('acepta el personaje de ejemplo', () => {
    expect(validateCharacter(exampleFighter5()).ok).toBe(true)
  })

  it('rechaza nombre vacío y nivel fuera de rango con mensajes claros', () => {
    const result = validateCharacter({ ...exampleFighter5(), name: ' ', level: 25 })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors).toContain('El personaje necesita nombre')
      expect(result.errors).toContain('Nivel: máximo 20')
    }
  })
})
