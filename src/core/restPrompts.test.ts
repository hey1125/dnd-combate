import { describe, expect, it } from 'vitest'
import { activeConditionRules } from './conditions'
import { exampleFighter5 } from './examples'
import { longRest } from './resources'
import { answerPrompt, promptsFor } from './restPrompts'
import { validateCharacter } from './schema'
import type { Character, RestPrompt } from './types'

const trastorno: RestPrompt = {
  id: 'trastorno',
  question: '¿Qué sacaste en el trastorno (1d4)?',
  after: 'both',
  options: [
    { label: '1 · Voces', effect: { name: 'Voces susurrantes', rules: [{ kind: 'disadvantage', text: 'Salvaciones de SAB' }] } },
    { label: '2 · Sombras', effect: { name: 'Sombras', rules: [{ kind: 'disadvantage', text: 'Percepción e Investigación' }] } },
    { label: '4 · Nada' },
  ],
}
const soloLargo: RestPrompt = { id: 'largo', question: '¿Algo?', after: 'long', options: [{ label: 'Sí' }] }
const withPrompts = (): Character => ({ ...exampleFighter5(), restPrompts: [trastorno, soloLargo] })

describe('recordatorios de descanso', () => {
  it('filtra por tipo de descanso', () => {
    expect(promptsFor(withPrompts(), 'short').map((p) => p.id)).toEqual(['trastorno'])
    expect(promptsFor(withPrompts(), 'long').map((p) => p.id)).toEqual(['trastorno', 'largo'])
  })

  it('la respuesta añade su estado con reglas, visibles en Ventajas', () => {
    const c = answerPrompt(withPrompts(), 'trastorno', 0)
    expect(c.effects.map((e) => e.name)).toEqual(['Voces susurrantes'])
    expect(activeConditionRules(c)[0].rules[0]).toEqual({ kind: 'disadvantage', text: 'Salvaciones de SAB' })
  })

  it('volver a responder reemplaza el estado anterior; "nada" lo quita', () => {
    let c = answerPrompt(withPrompts(), 'trastorno', 0)
    c = answerPrompt(c, 'trastorno', 1)
    expect(c.effects.map((e) => e.name)).toEqual(['Sombras'])
    c = answerPrompt(c, 'trastorno', 2)
    expect(c.effects).toEqual([])
  })

  it('no toca otros estados', () => {
    let c: Character = { ...withPrompts(), effects: [{ id: 'x', name: 'Derribado', roundsLeft: null }] }
    c = answerPrompt(c, 'trastorno', 0)
    expect(c.effects.map((e) => e.name)).toEqual(['Derribado', 'Voces susurrantes'])
  })

  it('el descanso largo quita el estado anterior antes de volver a preguntar', () => {
    const c = longRest(answerPrompt(withPrompts(), 'trastorno', 0))
    expect(c.effects).toEqual([])
  })

  it('valida y carga personajes viejos sin recordatorios', () => {
    const { restPrompts: _x, ...old } = exampleFighter5()
    void _x
    const v = validateCharacter(old)
    expect(v.ok && v.character.restPrompts).toEqual([])
    expect(validateCharacter(withPrompts()).ok).toBe(true)
    expect(validateCharacter({ ...withPrompts(), restPrompts: [{ ...trastorno, options: [] }] }).ok).toBe(false)
  })
})
