import { describe, expect, it } from 'vitest'
import { shortcutFor } from './shortcuts'

const key = (k: string, extra: Partial<Parameters<typeof shortcutFor>[0]> = {}) =>
  shortcutFor({ key: k, ctrlKey: false, metaKey: false, altKey: false, repeat: false, typing: false, ...extra })

describe('shortcutFor', () => {
  it('reconoce los atajos', () => {
    expect(key('n')).toBe('nextTurn')
    expect(key('N')).toBe('nextTurn')
    expect(key('/')).toBe('search')
    expect(key('z', { ctrlKey: true })).toBe('undo')
    expect(key('z', { metaKey: true })).toBe('undo')
  })

  it('no hace nada mientras escribes', () => {
    expect(key('n', { typing: true })).toBeNull()
    expect(key('z', { ctrlKey: true, typing: true })).toBeNull()
  })

  it('no pisa atajos del navegador ni repite al mantener pulsado', () => {
    expect(key('n', { ctrlKey: true })).toBeNull()
    expect(key('n', { altKey: true })).toBeNull()
    expect(key('n', { repeat: true })).toBeNull()
    expect(key('z')).toBeNull()
  })
})
