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
  handlers: PlaybackShortcutHandlers
): boolean {
  if (event.repeat || isEditableTarget(event.target)) return false

  const handler = event.code === 'Space'
    ? handlers.togglePlay
    : event.code === 'ArrowLeft'
      ? handlers.playPrev
      : event.code === 'ArrowRight'
        ? handlers.playNext
        : null

  if (!handler) return false

  event.preventDefault()
  void handler()
  return true
}
