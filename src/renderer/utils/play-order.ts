import type { PlayMode } from './types'

type Random = () => number

/**
 * 下一首的位置。随机播放时避开当前这首，其余模式按顺序循环。
 * 单曲循环只影响"播完自动重播"，手动下一首仍然顺序走。
 */
export function pickNextIndex(
  length: number,
  current: number,
  mode: PlayMode,
  random: Random = Math.random
): number {
  if (length <= 0) return -1
  if (length === 1) return 0

  if (mode === 'shuffle') return pickRandomIndex(length, current, random)

  const base = current < 0 ? -1 : current
  return (base + 1 + length) % length
}

/** 上一首的位置。随机播放时同样随机取一首 */
export function pickPrevIndex(
  length: number,
  current: number,
  mode: PlayMode,
  random: Random = Math.random
): number {
  if (length <= 0) return -1
  if (length === 1) return 0

  if (mode === 'shuffle') return pickRandomIndex(length, current, random)

  const base = current < 0 ? 0 : current
  return (base - 1 + length) % length
}

function pickRandomIndex(length: number, current: number, random: Random): number {
  // 在"除当前这首以外"的曲目里取一首，保证不会连着放同一首
  const pick = Math.floor(random() * (length - 1))
  const safePick = Math.min(Math.max(pick, 0), length - 2)
  return current < 0 || safePick < current ? safePick : safePick + 1
}
