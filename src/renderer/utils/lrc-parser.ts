export interface LyricLine {
  time: number
  text: string
}

const TIME_TAG_RE = /\[(\d{1,2}):(\d{2})(?:\.(\d{2,3}))?\]/g
const META_TAGS = new Set(['ti', 'ar', 'al', 'by', 'offset', 'length', 're', 've'])

export function parseLRC(raw: string): LyricLine[] {
  const lines = raw.split(/\r?\n/)
  const result: LyricLine[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    const times: number[] = []
    let match: RegExpExecArray | null

    TIME_TAG_RE.lastIndex = 0
    while ((match = TIME_TAG_RE.exec(trimmed))) {
      const tag = match[0].slice(1, -1)
      const colonIdx = tag.indexOf(':')
      const prefix = tag.slice(0, colonIdx)
      if (META_TAGS.has(prefix)) continue

      const min = parseInt(match[1], 10)
      const sec = parseInt(match[2], 10)
      let ms = match[3] ? parseInt(match[3], 10) : 0
      if (match[3] && match[3].length === 2) ms *= 10
      times.push(min * 60 + sec + ms / 1000)
    }

    if (times.length === 0) continue

    const text = trimmed.replace(/\[\d{1,2}:\d{2}(?:\.\d{2,3})?\]/g, '').trim()
    for (const t of times) {
      result.push({ time: t, text })
    }
  }

  result.sort((a, b) => a.time - b.time)
  return result
}

export function findCurrentLine(lines: LyricLine[], currentTime: number): number {
  if (lines.length === 0) return -1
  let lo = 0, hi = lines.length - 1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (lines[mid].time <= currentTime) lo = mid + 1
    else hi = mid - 1
  }
  return hi >= 0 ? hi : -1
}
