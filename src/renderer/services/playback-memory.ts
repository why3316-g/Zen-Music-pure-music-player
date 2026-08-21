import {
  RESUME_KEY,
  getResumePosition,
  parseResumeMap,
  rememberPosition,
  forgetPosition,
  type ResumeMap
} from '../utils/resume-positions'

const FLUSH_INTERVAL = 5000

let map: ResumeMap = {}
let dirty = false
let lastFlush = 0

function flushNow() {
  if (!dirty) return
  dirty = false
  lastFlush = Date.now()
  try {
    localStorage.setItem(RESUME_KEY, JSON.stringify(map))
  } catch {
    // 存储满了就算了，进度记忆不是关键数据
  }
}

/** 记住每个文件播到哪了，供"从上次位置继续"用 */
export const playbackMemory = {
  load() {
    map = parseResumeMap(localStorage.getItem(RESUME_KEY))
  },

  /** 播放过程中持续调用，写盘按 5 秒节流 */
  remember(filePath: string | null | undefined, time: number, duration = 0) {
    if (!filePath) return
    rememberPosition(map, filePath, time, duration)
    dirty = true
    if (Date.now() - lastFlush >= FLUSH_INTERVAL) flushNow()
  },

  get(filePath: string | null | undefined, duration = 0): number {
    if (!filePath) return 0
    return getResumePosition(map, filePath, duration)
  },

  forget(filePath: string | null | undefined) {
    if (!filePath) return
    forgetPosition(map, filePath)
    dirty = true
  },

  flush: flushNow
}
