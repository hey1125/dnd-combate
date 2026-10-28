import { describe, expect, it } from 'vitest'
import { pushRecent } from './recent'

describe('pushRecent', () => {
  it('pone el último primero, sin repetidos y con máximo', () => {
    expect(pushRecent([], 8)).toEqual([8])
    expect(pushRecent([8, 5], 5)).toEqual([5, 8])
    expect(pushRecent([1, 2, 3, 4], 9)).toEqual([9, 1, 2, 3])
  })
})
