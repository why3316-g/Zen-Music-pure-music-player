import { describe, expect, it } from 'vitest'
import {
  MAX_RESUME_ENTRIES,
  forgetPosition,
  getResumePosition,
  parseResumeMap,
  rememberPosition,
  type ResumeMap
} from './resume-positions'

describe('parseResumeMap', () => {
  it('returns an empty map for missing or broken data', () => {
    expect(parseResumeMap(null)).toEqual({})
    expect(parseResumeMap('{broken')).toEqual({})
    expect(parseResumeMap('[1,2]')).toEqual({})
  })

  it('drops non-numeric entries', () => {
    expect(parseResumeMap('{"a.mp4":120,"b.mp4":"x","c.mp4":0}')).toEqual({ 'a.mp4': 120 })
  })
})

describe('rememberPosition', () => {
  it('stores a mid-file position', () => {
    const map = rememberPosition({}, 'a.mp4', 120, 600)
    expect(map['a.mp4']).toBe(120)
  })

  it('ignores the first few seconds', () => {
    const map = rememberPosition({ 'a.mp4': 120 }, 'a.mp4', 3, 600)
    expect(map['a.mp4']).toBeUndefined()
  })

  it('forgets a file watched to the end', () => {
    const map = rememberPosition({ 'a.mp4': 120 }, 'a.mp4', 595, 600)
    expect(map['a.mp4']).toBeUndefined()
  })

  it('evicts the oldest entries past the cap', () => {
    const map: ResumeMap = {}
    for (let i = 0; i < MAX_RESUME_ENTRIES + 5; i++) {
      rememberPosition(map, `f${i}.mp4`, 60, 600)
    }
    expect(Object.keys(map)).toHaveLength(MAX_RESUME_ENTRIES)
    expect(map['f0.mp4']).toBeUndefined()
    expect(map[`f${MAX_RESUME_ENTRIES + 4}.mp4`]).toBe(60)
  })
})

describe('getResumePosition', () => {
  it('returns 0 when nothing was remembered', () => {
    expect(getResumePosition({}, 'a.mp4')).toBe(0)
  })

  it('returns the remembered position', () => {
    expect(getResumePosition({ 'a.mp4': 200 }, 'a.mp4', 600)).toBe(200)
  })

  it('returns 0 when the stored position is past the end', () => {
    expect(getResumePosition({ 'a.mp4': 599 }, 'a.mp4', 600)).toBe(0)
  })
})

describe('forgetPosition', () => {
  it('removes one entry', () => {
    expect(forgetPosition({ 'a.mp4': 200, 'b.mp4': 10 }, 'a.mp4')).toEqual({ 'b.mp4': 10 })
  })
})
