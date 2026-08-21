import type { ArrowKeyAction } from './settings-schema'

export interface PlaybackShortcutEvent {
  code: string
  repeat: boolean
  target: unknown
  preventDefault: () => void
}

export interface PlaybackShortcutHandlers {
  togglePlay: () => void | Promise<void>
  playPrev: () => void | Promise<void>
  playNext: () => void | Promise<void>
  /** 相对当前位置快进（正数）/后退（负数），单位秒 */
  seekBy: (deltaSeconds: number) => void | Promise<void>
}

export interface PlaybackShortcutOptions {
  arrowKeyAction: ArrowKeyAction
  seekStep: number
}

export const DEFAULT_SHORTCUT_OPTIONS: PlaybackShortcutOptions = {
  arrowKeyAction: 'seek',
  seekStep: 5
}

interface ElementLike {
  tagName?: string
  isContentEditable?: boolean
  closest?: (selector: string) => unknown
}

function isEditableTarget(target: unknown): boolean {
  if (!target || typeof target !== 'object') return false

  const element = target as ElementLike
  const tagName = element.tagName?.toUpperCase()
  if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') return true
  if (element.isContentEditable) return true

  return element.closest?.('[contenteditable="true"]') != null
}

export function handlePlaybackShortcut(
  event: PlaybackShortcutEvent,
  handlers: PlaybackShortcutHandlers,
  options: PlaybackShortcutOptions = DEFAULT_SHORTCUT_OPTIONS
): boolean {
  if (isEditableTarget(event.target)) return false
  // 空格按住不重复触发，方向键按住可以连续快进
  if (event.repeat && event.code === 'Space') return false

  const step = options.seekStep > 0 ? options.seekStep : DEFAULT_SHORTCUT_OPTIONS.seekStep
  const seeksWithArrows = options.arrowKeyAction !== 'track'

  let handler: (() => void | Promise<void>) | null = null
  if (event.code === 'Space') {
    handler = handlers.togglePlay
  } else if (event.code === 'ArrowLeft') {
    handler = seeksWithArrows ? () => handlers.seekBy(-step) : handlers.playPrev
  } else if (event.code === 'ArrowRight') {
    handler = seeksWithArrows ? () => handlers.seekBy(step) : handlers.playNext
  }

  if (!handler) return false

  event.preventDefault()
  void handler()
  return true
}
