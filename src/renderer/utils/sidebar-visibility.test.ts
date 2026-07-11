import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  SIDEBAR_HIDE_DELAY,
  SIDEBAR_PINNED_KEY,
  createSidebarVisibilityController,
  readSidebarPinned,
  writeSidebarPinned
} from './sidebar-visibility'

function createController(initialPinned = false) {
  const visibilityChanges: boolean[] = []
  const pinnedChanges: boolean[] = []
  const controller = createSidebarVisibilityController({
    initialPinned,
    onVisibilityChange: (visible) => visibilityChanges.push(visible),
    onPinnedChange: (pinned) => pinnedChanges.push(pinned)
  })

  return { controller, visibilityChanges, pinnedChanges }
}

describe('sidebar visibility controller', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('stays visible while hovered and hides five seconds after leave', () => {
    const { controller } = createController()
    controller.start()
    vi.advanceTimersByTime(SIDEBAR_HIDE_DELAY - 1)
    expect(controller.visible).toBe(true)

    controller.pointerEnter()
    vi.advanceTimersByTime(SIDEBAR_HIDE_DELAY)
    expect(controller.visible).toBe(true)

    controller.pointerLeave()
    vi.advanceTimersByTime(SIDEBAR_HIDE_DELAY - 1)
    expect(controller.visible).toBe(true)
    vi.advanceTimersByTime(1)
    expect(controller.visible).toBe(false)
  })

  it('never auto-hides while pinned', () => {
    const { controller } = createController(true)
    controller.start()
    controller.pointerLeave()

    vi.advanceTimersByTime(SIDEBAR_HIDE_DELAY * 2)

    expect(controller.visible).toBe(true)
    expect(controller.pinned).toBe(true)
  })

  it('starts a hide timer after unpinning outside the sidebar', () => {
    const { controller, pinnedChanges } = createController(true)

    controller.togglePinned()
    vi.advanceTimersByTime(SIDEBAR_HIDE_DELAY)

    expect(pinnedChanges).toEqual([false])
    expect(controller.pinned).toBe(false)
    expect(controller.visible).toBe(false)
  })

  it('allows manual hide without clearing the pin', () => {
    const { controller, pinnedChanges } = createController(true)

    controller.toggleVisible()
    expect(controller.visible).toBe(false)
    expect(controller.pinned).toBe(true)
    expect(pinnedChanges).toEqual([])

    controller.toggleVisible()
    vi.advanceTimersByTime(SIDEBAR_HIDE_DELAY)
    expect(controller.visible).toBe(true)
  })

  it('shows immediately and restarts auto-hide when requested', () => {
    const { controller } = createController()
    controller.start()
    vi.advanceTimersByTime(SIDEBAR_HIDE_DELAY)
    expect(controller.visible).toBe(false)

    controller.show()
    expect(controller.visible).toBe(true)
    vi.advanceTimersByTime(SIDEBAR_HIDE_DELAY)
    expect(controller.visible).toBe(false)
  })

  it('cancels pending work when disposed', () => {
    const { controller } = createController()
    controller.start()

    controller.dispose()
    vi.advanceTimersByTime(SIDEBAR_HIDE_DELAY)

    expect(controller.visible).toBe(true)
  })
})

describe('sidebar pin persistence', () => {
  it('restores and saves the pinned value', () => {
    const values = new Map<string, string>()
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value)
    }

    expect(readSidebarPinned(storage)).toBe(false)
    writeSidebarPinned(storage, true)
    expect(values.get(SIDEBAR_PINNED_KEY)).toBe('true')
    expect(readSidebarPinned(storage)).toBe(true)

    writeSidebarPinned(storage, false)
    expect(readSidebarPinned(storage)).toBe(false)
  })
})
