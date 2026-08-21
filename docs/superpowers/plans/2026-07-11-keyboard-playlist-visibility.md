# Keyboard and Playlist Visibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Space toggle playback, Left/Right select the previous/next track, and give the playlist hover-safe auto-hide behavior with a persistent pin control.

**Architecture:** Put keyboard classification in a pure utility and sidebar timing/persistence in a small state controller so both behaviors can be tested without mounting Electron or the audio engine. `Player.vue` wires keyboard actions to existing transport methods; `App.vue` owns sidebar state while `Playlist.vue` only renders and emits the pin control.

**Tech Stack:** Electron 33, Vue 3 Composition API, TypeScript, Vitest 3

---

### Task 1: Playback keyboard router

**Files:**
- Create: `src/renderer/utils/playback-shortcuts.ts`
- Create: `src/renderer/utils/playback-shortcuts.test.ts`

- [ ] **Step 1: Write the failing keyboard tests**

Test a focused button, editable targets, repeated keydowns, unmapped keys, and action dispatch:

```ts
import { describe, expect, it, vi } from 'vitest'
import { handlePlaybackShortcut } from './playback-shortcuts'

function event(code: string, target: object, repeat = false) {
  return {
    code,
    target,
    repeat,
    preventDefault: vi.fn()
  }
}

describe('handlePlaybackShortcut', () => {
  it('handles Space even when a button has focus', () => {
    const e = event('Space', { tagName: 'BUTTON' })
    const togglePlay = vi.fn()
    expect(handlePlaybackShortcut(e, { togglePlay, playPrev: vi.fn(), playNext: vi.fn() })).toBe(true)
    expect(e.preventDefault).toHaveBeenCalledOnce()
    expect(togglePlay).toHaveBeenCalledOnce()
  })

  it.each([
    ['ArrowLeft', 'playPrev'],
    ['ArrowRight', 'playNext']
  ] as const)('maps %s to %s', (code, action) => {
    const handlers = { togglePlay: vi.fn(), playPrev: vi.fn(), playNext: vi.fn() }
    handlePlaybackShortcut(event(code, { tagName: 'DIV' }), handlers)
    expect(handlers[action]).toHaveBeenCalledOnce()
  })

  it.each(['INPUT', 'TEXTAREA', 'SELECT'])('ignores %s targets', (tagName) => {
    const handlers = { togglePlay: vi.fn(), playPrev: vi.fn(), playNext: vi.fn() }
    expect(handlePlaybackShortcut(event('Space', { tagName }), handlers)).toBe(false)
    expect(handlers.togglePlay).not.toHaveBeenCalled()
  })

  it('ignores contenteditable targets and repeated keydowns', () => {
    const handlers = { togglePlay: vi.fn(), playPrev: vi.fn(), playNext: vi.fn() }
    expect(handlePlaybackShortcut(event('Space', { isContentEditable: true }), handlers)).toBe(false)
    expect(handlePlaybackShortcut(event('Space', { tagName: 'BUTTON' }, true), handlers)).toBe(false)
  })
})
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- src/renderer/utils/playback-shortcuts.test.ts`

Expected: FAIL because `./playback-shortcuts` does not exist.

- [ ] **Step 3: Implement the minimal router**

Create typed event and handler interfaces, detect `INPUT`, `TEXTAREA`, `SELECT`, and contenteditable ancestors, ignore `repeat`, call `preventDefault()`, and dispatch Space/Left/Right to `togglePlay`, `playPrev`, or `playNext`.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `npm test -- src/renderer/utils/playback-shortcuts.test.ts`

Expected: all shortcut tests PASS.

### Task 2: Wire keyboard actions into the player

**Files:**
- Modify: `src/renderer/components/Player.vue`

- [ ] **Step 1: Replace the anonymous listener with a named handler**

Import `handlePlaybackShortcut` and add:

```ts
function onPlaybackKeyDown(e: KeyboardEvent) {
  handlePlaybackShortcut(e, {
    togglePlay,
    playPrev,
    playNext
  })
}
```

- [ ] **Step 2: Replace the old seek shortcuts**

Remove `seekBy()` and the anonymous `keydown` callback that required `e.target === document.body`. Register `onPlaybackKeyDown` in `onMounted` and remove the same function in `onUnmounted`.

- [ ] **Step 3: Verify tests and type-check the wiring**

Run: `npm test -- src/renderer/utils/playback-shortcuts.test.ts`

Run: `npx vue-tsc --noEmit -p tsconfig.web.json`

Expected: both commands PASS with no TypeScript errors.

### Task 3: Sidebar visibility state controller

**Files:**
- Create: `src/renderer/utils/sidebar-visibility.ts`
- Create: `src/renderer/utils/sidebar-visibility.test.ts`

- [ ] **Step 1: Write failing timer and persistence tests**

Use `vi.useFakeTimers()` and cover these outcomes:

```ts
it('stays visible while hovered and hides five seconds after leave')
it('never auto-hides while pinned')
it('starts a hide timer after unpinning outside the sidebar')
it('allows manual hide without clearing the pin')
it('restores and saves the pinned localStorage value')
```

The controller is constructed with callbacks:

```ts
const controller = createSidebarVisibilityController({
  initialPinned: false,
  hideDelay: 5000,
  onVisibilityChange: (visible) => states.push(visible),
  onPinnedChange: (pinned) => pinStates.push(pinned)
})
```

- [ ] **Step 2: Run the sidebar test and verify RED**

Run: `npm test -- src/renderer/utils/sidebar-visibility.test.ts`

Expected: FAIL because `./sidebar-visibility` does not exist.

- [ ] **Step 3: Implement the controller and storage helpers**

Export `SIDEBAR_HIDE_DELAY = 5000`, `SIDEBAR_PINNED_KEY = 'zen-music-sidebar-pinned'`, `readSidebarPinned()`, `writeSidebarPinned()`, and `createSidebarVisibilityController()`. The controller exposes `start`, `show`, `toggleVisible`, `pointerEnter`, `pointerLeave`, `togglePinned`, and `dispose`; every timer is cleared before scheduling a new one.

- [ ] **Step 4: Run the sidebar test and verify GREEN**

Run: `npm test -- src/renderer/utils/sidebar-visibility.test.ts`

Expected: all visibility and persistence tests PASS.

### Task 4: Add the pin control and integrate sidebar behavior

**Files:**
- Modify: `src/renderer/App.vue`
- Modify: `src/renderer/components/Playlist.vue`

- [ ] **Step 1: Wire controller state in `App.vue`**

Import the sidebar utilities and `onUnmounted`. Initialize `sidebarPinned` from localStorage, update Vue refs through controller callbacks, and persist changes with `writeSidebarPinned()`.

- [ ] **Step 2: Replace the existing reset timer**

Replace `resetSidebarTimer()` calls with controller methods. Bind the sidebar to `@mouseenter="sidebarVisibility.pointerEnter"` and `@mouseleave="sidebarVisibility.pointerLeave"`. Pass `:pinned="sidebarPinned"` and `@toggle-pin="sidebarVisibility.togglePinned"` to `Playlist`.

- [ ] **Step 3: Clean up lifecycle resources**

Call `sidebarVisibility.start()` after mount and `sidebarVisibility.dispose()` during unmount. Preserve the user's current startup auto-play and play-mode persistence edits in `App.vue`.

- [ ] **Step 4: Render the pin button in `Playlist.vue`**

Add a required `pinned` prop and a `toggle-pin` emit. Place an SVG pin button in `.playlist__selector`, with `aria-pressed`, dynamic title text, and an active modifier class. Add scoped styles matching the existing 28px title controls and use `var(--accent)` for the active state.

- [ ] **Step 5: Run focused and full verification**

Run: `npm test`

Run: `npx vue-tsc --noEmit -p tsconfig.web.json`

Run: `npm run build`

Expected: all tests pass, type-check exits 0, and Electron/Vite production build completes successfully.

### Task 5: Review the final diff

**Files:**
- Review only: all files changed above plus pre-existing user modifications

- [ ] **Step 1: Check scope and whitespace**

Run: `git diff --check`

Run: `git status --short`

Expected: no whitespace errors; `electron/main.ts` remains unchanged by this task; only the planned renderer files, tests, and docs are new or modified.

- [ ] **Step 2: Confirm every design requirement is represented**

Verify the final diff contains focused-button Space handling, Left/Right track switching, editable/repeat guards, named listener cleanup, hover cancellation, five-second leave delay, persistent pin state, manual show/hide, and the active pin UI.
