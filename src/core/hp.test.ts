import { describe, expect, it } from 'vitest'
import { exampleFighter5 } from './examples'
import { concentrationDC, heal, setTempHp, takeDamage } from './hp'

describe('Puntos de golpe', () => {
  it('el daño gasta primero los PG temporales', () => {
    const c = setTempHp(exampleFighter5(), 5)
    const { character } = takeDamage(c, 8)
    expect(character.hp).toEqual({ current: 41, max: 44, temp: 0 })
  })

  it('no baja de 0 ni cura por encima del máximo', () => {
    let c = takeDamage(exampleFighter5(), 50).character
    expect(c.hp.current).toBe(0)
    c = heal(c, 100)
    expect(c.hp.current).toBe(44)
  })

  it('los PG temporales no se acumulan', () => {
    let c = setTempHp(exampleFighter5(), 8)
    c = setTempHp(c, 5)
    expect(c.hp.temp).toBe(8)
  })

  it('pide salvación de concentración con la CD correcta', () => {
    const c = { ...exampleFighter5(), concentratingOn: 'Bendecir' }
    expect(takeDamage(c, 12).concentrationDC).toBe(10)
    expect(takeDamage(c, 25).concentrationDC).toBe(12)
    expect(takeDamage(exampleFighter5(), 25).concentrationDC).toBeUndefined()
    expect(concentrationDC(100)).toBe(30)
  })
})
