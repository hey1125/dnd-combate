import { describe, expect, it } from 'vitest'
import { isDead, recordDeathSave, revive } from './deathSaves'
import { addEffect, removeEffect } from './effects'
import { exampleFighter5 } from './examples'
import { fullCasterSlots, newFeature } from './factory'
import { heal, takeDamage } from './hp'
import { exportCharacters, parseImport } from './io'
import { getResource } from './resources'
import { castOptions } from './spells'
import { applyFeature, startTurn } from './turn'
import type { Character, Result } from './types'

function must(result: Result): Character {
  if (!result.ok) throw new Error(result.error)
  return result.character
}

/** Maga nivel 5 con Bendecir (nv 1, concentración, 10 rondas, se puede subir) y Proyectil Mágico. */
function wizard(): Character {
  const bless = newFeature({ id: 'bless', name: 'Bendecir', resourceId: 'slot-1', concentration: true, durationRounds: 10, upcast: true })
  const missile = newFeature({ id: 'missile', name: 'Proyectil Mágico', resourceId: 'slot-1', upcast: true })
  const shield = newFeature({ id: 'shield', name: 'Escudo', cost: 'reaction', resourceId: 'slot-1' })
  return { ...exampleFighter5(), name: 'Elara', hp: { current: 27, max: 27, temp: 0 }, resources: fullCasterSlots(5), features: [bless, missile, shield] }
}
const f = (c: Character, id: string) => c.features.find((x) => x.id === id)!

describe('Conjuros a nivel superior', () => {
  it('ofrece su nivel y superiores solo si se puede subir', () => {
    const c = wizard()
    expect(castOptions(c, f(c, 'missile')).map((r) => r.id)).toEqual(['slot-1', 'slot-2', 'slot-3'])
    expect(castOptions(c, f(c, 'shield')).map((r) => r.id)).toEqual(['slot-1'])
  })

  it('gasta el espacio elegido y lo indica en el nombre del efecto', () => {
    let c = wizard()
    c = must(applyFeature(c, f(c, 'bless'), { slotId: 'slot-3' }))
    expect(getResource(c, 'slot-3')?.current).toBe(1)
    expect(getResource(c, 'slot-1')?.current).toBe(4)
    expect(c.concentratingOn).toBe('Bendecir (nv 3)')
  })

  it('no deja usar un espacio menor ni subir un conjuro que no lo permite', () => {
    const c = wizard()
    expect(applyFeature(c, f(c, 'shield'), { slotId: 'slot-2' }).ok).toBe(false)
  })

  it('avisa (sin bloquear) si gastas dos espacios en el mismo turno', () => {
    let c = wizard()
    const first = applyFeature(c, f(c, 'missile'))
    expect(first.ok && first.warning).toBeFalsy()
    c = must(first)
    const second = applyFeature(c, f(c, 'shield'))
    expect(second.ok).toBe(true)
    expect(second.ok && second.warning).toMatch(/uno por turno/)
    c = must(startTurn(must(second)))
    expect(c.turn.slotsSpent).toBe(0)
  })
})

describe('Efectos con duración', () => {
  it('Bendecir dura 10 rondas y al terminar quita la concentración', () => {
    let c = must(applyFeature(wizard(), f(wizard(), 'bless')))
    expect(c.effects[0]).toMatchObject({ name: 'Bendecir', roundsLeft: 10, concentration: true })
    let last: Result = { ok: true, character: c }
    for (let i = 0; i < 10; i++) {
      last = startTurn(c)
      c = must(last)
    }
    expect(c.effects).toHaveLength(0)
    expect(c.concentratingOn).toBeNull()
    expect(last.ok && last.warning).toBe('Terminó: Bendecir')
  })

  it('un conjuro de concentración nuevo reemplaza al anterior', () => {
    let c = wizard()
    c = must(applyFeature(c, f(c, 'bless')))
    c = must(startTurn(c))
    c = must(applyFeature(c, f(c, 'bless'), { slotId: 'slot-2' }))
    expect(c.effects.map((e) => e.name)).toEqual(['Bendecir (nv 2)'])
  })

  it('los estados sin duración se quedan hasta quitarlos', () => {
    let c = addEffect(wizard(), { name: 'Envenenado', roundsLeft: null })
    c = must(startTurn(c))
    expect(c.effects).toHaveLength(1)
    c = removeEffect(c, c.effects[0].id)
    expect(c.effects).toHaveLength(0)
  })
})

describe('Salvaciones contra muerte', () => {
  const down = () => takeDamage(wizard(), 27).character

  it('caer a 0 PG hace perder la concentración', () => {
    const c = must(applyFeature(wizard(), f(wizard(), 'bless')))
    const r = takeDamage(c, 30)
    expect(r.character.hp.current).toBe(0)
    expect(r.character.concentratingOn).toBeNull()
    expect(r.notes.join(' ')).toMatch(/concentración/)
  })

  it('3 éxitos = estable, 3 fallos = muerto', () => {
    let c = down()
    c = must(recordDeathSave(c, 'success'))
    c = must(recordDeathSave(c, 'success'))
    c = must(recordDeathSave(c, 'success'))
    expect(c.deathSaves.stable).toBe(true)

    let d = down()
    d = must(recordDeathSave(d, 'nat1'))
    d = must(recordDeathSave(d, 'failure'))
    expect(isDead(d)).toBe(true)
  })

  it('20 natural recupera 1 PG', () => {
    const c = must(recordDeathSave(down(), 'nat20'))
    expect(c.hp.current).toBe(1)
    expect(c.deathSaves.failures).toBe(0)
  })

  it('recibir daño a 0 PG es un fallo; daño masivo mata', () => {
    let c = down()
    c = takeDamage(c, 5).character
    expect(c.deathSaves.failures).toBe(1)
    expect(isDead(takeDamage(down(), 27).character)).toBe(true)
    expect(isDead(takeDamage(wizard(), 27 + 27).character)).toBe(true)
  })

  it('curar desde 0 reinicia las salvaciones; muerto no se cura pero se puede revivir', () => {
    let c = must(recordDeathSave(down(), 'failure'))
    c = heal(c, 5)
    expect(c.hp.current).toBe(5)
    expect(c.deathSaves.failures).toBe(0)
    const dead = takeDamage(down(), 100).character
    expect(heal(dead, 10).hp.current).toBe(0)
    expect(revive(dead).hp.current).toBe(1)
  })

  it('a 0 PG no se puede atacar ni usar rasgos', () => {
    const c = down()
    expect(applyFeature(c, f(c, 'missile')).ok).toBe(false)
  })
})

describe('Exportar e importar', () => {
  it('ida y vuelta conserva los personajes', () => {
    const chars = [wizard(), exampleFighter5()]
    const r = parseImport(exportCharacters(chars))
    expect(r.ok && r.characters).toEqual(chars)
  })

  it('migra personajes guardados antes (sin efectos ni salvaciones)', () => {
    const old = structuredClone(exampleFighter5()) as unknown as { effects?: unknown; deathSaves?: unknown; turn: { slotsSpent?: number } }
    delete old.effects
    delete old.deathSaves
    delete old.turn.slotsSpent
    const r = parseImport(JSON.stringify(old))
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.characters[0].effects).toEqual([])
      expect(r.characters[0].turn.slotsSpent).toBe(0)
    }
  })

  it('reporta los inválidos y rechaza archivos rotos', () => {
    const r = parseImport(JSON.stringify([exampleFighter5(), { name: 'Roto' }]))
    expect(r.ok && r.skipped[0]).toMatch(/^Roto:/)
    expect(parseImport('no es json').ok).toBe(false)
  })
})
