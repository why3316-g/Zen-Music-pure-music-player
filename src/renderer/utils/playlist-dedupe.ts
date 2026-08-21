interface PathLike {
  filePath: string
}

export interface DedupeResult<T extends PathLike> {
  tracks: T[]
  currentIndex: number
  removed: number
}

/**
 * 同一个文件在一个列表里只保留第一条，并把 currentIndex 修正到保留下来的那条。
 * 既用于新增时去重，也用于清洗历史存档里已经重复的列表。
 */
export function dedupeTracks<T extends PathLike>(tracks: T[], currentIndex: number): DedupeResult<T> {
  const seen = new Map<string, number>()
  const kept: T[] = []
  // 旧索引 -> 新索引（重复项指向首次出现的位置）
  const remap: number[] = []

  tracks.forEach((track, i) => {
    const existing = seen.get(track.filePath)
    if (existing === undefined) {
      seen.set(track.filePath, kept.length)
      remap[i] = kept.length
      kept.push(track)
    } else {
      remap[i] = existing
    }
  })

  const removed = tracks.length - kept.length
  let nextIndex = -1
  if (kept.length > 0 && currentIndex >= 0 && currentIndex < tracks.length) {
    nextIndex = remap[currentIndex]
  }

  return { tracks: kept, currentIndex: nextIndex, removed }
}

/** 过滤掉已经在列表里的路径，同时去掉本批次内部的重复 */
export function filterNewTracks<T extends PathLike>(existing: PathLike[], incoming: T[]): T[] {
  const known = new Set(existing.map(t => t.filePath))
  const result: T[] = []
  for (const track of incoming) {
    if (known.has(track.filePath)) continue
    known.add(track.filePath)
    result.push(track)
  }
  return result
}
