export const SIDEBAR_HIDE_DELAY = 5000
export const SIDEBAR_PINNED_KEY = 'zen-music-sidebar-pinned'

interface ReadableStorage {
  getItem: (key: string) => string | null
}

interface WritableStorage {
  setItem: (key: string, value: string) => unknown
}

export function readSidebarPinned(storage: ReadableStorage): boolean {
  return storage.getItem(SIDEBAR_PINNED_KEY) === 'true'
}

export function writeSidebarPinned(storage: WritableStorage, pinned: boolean): void {
  storage.setItem(SIDEBAR_PINNED_KEY, String(pinned))
}

export interface SidebarVisibilityOptions {
  initialPinned: boolean
  hideDelay?: number
  onVisibilityChange: (visible: boolean) => void
  onPinnedChange: (pinned: boolean) => void
}

export interface SidebarVisibilityController {
  readonly visible: boolean
  readonly pinned: boolean
  start: () => void
  show: () => void
  toggleVisible: () => void
  pointerEnter: () => void
  pointerLeave: () => void
  togglePinned: () => void
  dispose: () => void
}

export function createSidebarVisibilityController(
  options: SidebarVisibilityOptions
): SidebarVisibilityController {
  const hideDelay = options.hideDelay ?? SIDEBAR_HIDE_DELAY
  let visible = true
  let pinned = options.initialPinned
  let pointerInside = false
  let hideTimer: ReturnType<typeof setTimeout> | null = null

  function clearHideTimer() {
    if (!hideTimer) return
    clearTimeout(hideTimer)
    hideTimer = null
  }

  function setVisible(nextVisible: boolean) {
    if (visible === nextVisible) return
    visible = nextVisible
    options.onVisibilityChange(visible)
  }

  function scheduleHide() {
    clearHideTimer()
    if (pinned || pointerInside || !visible) return

    hideTimer = setTimeout(() => {
      hideTimer = null
      setVisible(false)
    }, hideDelay)
  }

  return {
    get visible() {
      return visible
    },
    get pinned() {
      return pinned
    },
    start: scheduleHide,
    show() {
      setVisible(true)
      scheduleHide()
    },
    toggleVisible() {
      if (visible) {
        clearHideTimer()
        setVisible(false)
      } else {
        setVisible(true)
        scheduleHide()
      }
    },
    pointerEnter() {
      pointerInside = true
      clearHideTimer()
      setVisible(true)
    },
    pointerLeave() {
      pointerInside = false
      scheduleHide()
    },
    togglePinned() {
      pinned = !pinned
      options.onPinnedChange(pinned)
      if (pinned) {
        clearHideTimer()
        setVisible(true)
      } else {
        scheduleHide()
      }
    },
    dispose: clearHideTimer
  }
}
