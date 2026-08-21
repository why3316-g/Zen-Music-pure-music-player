import { describe, expect, it } from 'vitest'
import { dedupeTracks, filterNewTracks } from './playlist-dedupe'

const t = (filePath: string) => ({ filePath })

describe('dedupeTracks', () => {
  it('leaves a clean list untouched', () => {
    const result = dedupeTracks([t('a'), t('b')], 1)
    expect(result.tracks.map(x => x.filePath)).toEqual(['a', 'b'])
    expect(result.currentIndex).toBe(1)
    expect(result.removed).toBe(0)
  })

  it('keeps the first copy of a repeated file', () => {
    const result = dedupeTracks([t('a'), t('b'), t('a'), t('a')], 0)
    expect(result.tracks.map(x => x.filePath)).toEqual(['a', 'b'])
    expect(result.removed).toBe(2)
  })

  it('points currentIndex at the surviving copy', () => {
    // 正在播放的是第 3 条（重复的 a），去重后应指向索引 0
    const result = dedupeTracks([t('a'), t('b'), t('a')], 2)
    expect(result.currentIndex).toBe(0)
  })

  it('shifts currentIndex left when duplicates before it are dropped', () => {
    const result = dedupeTracks([t('a'), t('a'), t('b')], 2)
    expect(result.tracks.map(x => x.filePath)).toEqual(['a', 'b'])
    expect(result.currentIndex).toBe(1)
  })

  it('returns -1 for an empty list', () => {
    expect(dedupeTracks([], 0)).toEqual({ tracks: [], currentIndex: -1, removed: 0 })
  })

  it('returns -1 when currentIndex is out of range', () => {
    expect(dedupeTracks([t('a')], 5).currentIndex).toBe(-1)
  })
})

describe('filterNewTracks', () => {
  it('drops files already in the list', () => {
    expect(filterNewTracks([t('a')], [t('a'), t('b')]).map(x => x.filePath)).toEqual(['b'])
  })

  it('drops duplicates inside one batch', () => {
    expect(filterNewTracks([], [t('a'), t('a'), t('b')]).map(x => x.filePath)).toEqual(['a', 'b'])
  })
})
