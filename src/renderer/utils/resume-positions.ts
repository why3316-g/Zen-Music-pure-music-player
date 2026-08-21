export const RESUME_KEY = 'zen-music-resume'
/** 播放不足这个秒数不记录，避免刚点开就被记成"上次位置" */
export const MIN_RESUME_SECONDS = 10
/** 距结尾这个秒数内视为已看完，下次从头开始 */
export const RESUME_END_MARGIN = 15
/** 最多记住多少个文件的进度，超出后丢弃最早写入的 */
export const MAX_RESUME_ENTRIES = 300

export type ResumeMap = Record<string, number>

export function parseResumeMap(raw: string | null): ResumeMap {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    const map: ResumeMap = {}
    for (const [path, value] of Object.entries(parsed)) {
      const time = Number(value)
      if (typeof path === 'string' && path && Number.isFinite(time) && time > 0) {
        map[path] = time
      }
    }
    return map
  } catch {
    return {}
  }
}

/**
 * 记录某个文件的播放进度。开头和结尾的进度不记（就地修改并返回同一个 map）。
 */
export function rememberPosition(
  map: ResumeMap,
  path: string,
  time: number,
  duration = 0
): ResumeMap {
  if (!path) return map

  const tooEarly = !Number.isFinite(time) || time < MIN_RESUME_SECONDS
  const nearEnd = duration > 0 && time >= duration - RESUME_END_MARGIN
  if (tooEarly || nearEnd) {
    delete map[path]
    return map
  }

  // 重新写入让它排到末尾，好让淘汰顺序反映最近使用
  delete map[path]
  map[path] = time

  const keys = Object.keys(map)
  for (let i = 0; i < keys.length - MAX_RESUME_ENTRIES; i++) {
    delete map[keys[i]]
  }
  return map
}

/** 取出记住的位置；没有记录、或已超出时长则返回 0（从头播放） */
export function getResumePosition(map: ResumeMap, path: string, duration = 0): number {
  const time = map[path]
  if (!Number.isFinite(time) || time < MIN_RESUME_SECONDS) return 0
  if (duration > 0 && time >= duration - RESUME_END_MARGIN) return 0
  return time
}

export function forgetPosition(map: ResumeMap, path: string): ResumeMap {
  delete map[path]
  return map
}
