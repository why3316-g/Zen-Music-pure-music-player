import { describe, expect, it } from 'vitest'
import { pickNextIndex, pickPrevIndex } from './play-order'

describe('pickNextIndex', () => {
  it('wraps around in list mode', () => {
    expect(pickNextIndex(3, 0, 'loop')).toBe(1)
    expect(pickNextIndex(3, 2, 'loop')).toBe(0)
  })

  it('still advances in single-repeat mode', () => {
    expect(pickNextIndex(3, 0, 'single')).toBe(1)
  })

  it('returns -1 for an empty list', () => {
    expect(pickNextIndex(0, -1, 'loop')).toBe(-1)
  })

  it('starts at 0 when nothing is selected', () => {
    expect(pickNextIndex(3, -1, 'loop')).toBe(0)
  })

  it('never repeats the current track in shuffle mode', () => {
    for (let current = 0; current < 4; current++) {
      for (const r of [0, 0.25, 0.5, 0.75, 0.999]) {
        const picked = pickNextIndex(4, current, 'shuffle', () => r)
        expect(picked).toBeGreaterThanOrEqual(0)
        expect(picked).toBeLessThan(4)
        expect(picked).not.toBe(current)
      }
    }
  })

  it('reaches every other track in shuffle mode', () => {
    const seen = new Set([0, 0.34, 0.67, 0.99].map(r => pickNextIndex(4, 1, 'shuffle', () => r)))
    expect([...seen].sort()).toEqual([0, 2, 3])
  })

  it('repeats the only track in a one-item list', () => {
    expect(pickNextIndex(1, 0, 'shuffle')).toBe(0)
  })
})

describe('pickPrevIndex', () => {
  it('wraps backwards in list mode', () => {
    expect(pickPrevIndex(3, 0, 'loop')).toBe(2)
    expect(pickPrevIndex(3, 2, 'loop')).toBe(1)
  })

  it('avoids the current track in shuffle mode', () => {
    expect(pickPrevIndex(3, 1, 'shuffle', () => 0.9)).not.toBe(1)
  })

  it('returns -1 for an empty list', () => {
    expect(pickPrevIndex(0, -1, 'loop')).toBe(-1)
  })
})
