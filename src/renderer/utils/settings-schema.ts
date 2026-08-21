import type { PlayMode } from './types'

/** 方向键行为：快进/后退 或 上一首/下一首 */
export type ArrowKeyAction = 'seek' | 'track'
/** 已在播放列表中的文件被重新打开时：从头播放 或 接着上次的位置 */
export type ReopenBehavior = 'restart' | 'resume'
/** 启动时的循环模式，'remember' = 沿用上次关闭前的选择 */
export type StartupPlayMode = PlayMode | 'remember'
/** 启动时的音量来源，'remember' = 沿用上次关闭前的音量 */
export type StartupVolumeMode = 'remember' | 'fixed'

export interface AppSettings {
  arrowKeyAction: ArrowKeyAction
  /** 方向键快进/后退的步长（秒） */
  seekStep: number
  reopenBehavior: ReopenBehavior
  /** 播放列表在鼠标移开后自动隐藏 */
  playlistAutoHide: boolean
  startupPlayMode: StartupPlayMode
  startupVolumeMode: StartupVolumeMode
  /** startupVolumeMode 为 fixed 时使用，0~1 */
  defaultVolume: number
}

export const SETTINGS_KEY = 'zen-music-settings'

/** 主流播放器（YouTube / B 站 / PotPlayer）的方向键默认步长是 5 秒 */
export const SEEK_STEPS = [3, 5, 10, 15, 30] as const

export const DEFAULT_SETTINGS: AppSettings = {
  arrowKeyAction: 'seek',
  seekStep: 5,
  reopenBehavior: 'restart',
  playlistAutoHide: true,
  startupPlayMode: 'remember',
  startupVolumeMode: 'remember',
  defaultVolume: 0.8
}

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback
}

/** 把任意来源（localStorage、旧版本）的数据补齐成完整设置，坏字段回落默认值 */
export function normalizeSettings(raw: unknown): AppSettings {
  const src = (raw && typeof raw === 'object' ? raw : {}) as Partial<AppSettings>

  const seekStep = Number(src.seekStep)
  const volume = Number(src.defaultVolume)

  return {
    arrowKeyAction: pick(src.arrowKeyAction, ['seek', 'track'], DEFAULT_SETTINGS.arrowKeyAction),
    seekStep: SEEK_STEPS.includes(seekStep as typeof SEEK_STEPS[number])
      ? seekStep
      : DEFAULT_SETTINGS.seekStep,
    reopenBehavior: pick(src.reopenBehavior, ['restart', 'resume'], DEFAULT_SETTINGS.reopenBehavior),
    playlistAutoHide: typeof src.playlistAutoHide === 'boolean'
      ? src.playlistAutoHide
      : DEFAULT_SETTINGS.playlistAutoHide,
    startupPlayMode: pick(src.startupPlayMode, ['loop', 'single', 'shuffle', 'remember'], DEFAULT_SETTINGS.startupPlayMode),
    startupVolumeMode: pick(src.startupVolumeMode, ['remember', 'fixed'], DEFAULT_SETTINGS.startupVolumeMode),
    defaultVolume: Number.isFinite(volume)
      ? Math.max(0, Math.min(1, volume))
      : DEFAULT_SETTINGS.defaultVolume
  }
}

/** 从 localStorage 读取设置，读不到或损坏时返回默认值 */
export function readSettings(storage: { getItem: (k: string) => string | null }): AppSettings {
  try {
    const raw = storage.getItem(SETTINGS_KEY)
    return normalizeSettings(raw ? JSON.parse(raw) : null)
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}
