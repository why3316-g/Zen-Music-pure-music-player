import { describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_SHORTCUT_OPTIONS,
  handlePlaybackShortcut
} from './playback-shortcuts'

function keyboardEvent(code: string, target: object, repeat = false) {
  return {
    code,
    target,
    repeat,
    preventDefault: vi.fn()
  }
}

function handlers() {
  return {
    togglePlay: vi.fn(),
    playPrev: vi.fn(),
    playNext: vi.fn(),
    seekBy: vi.fn()
  }
}

const trackMode = { arrowKeyAction: 'track', seekStep: 5 } as const

describe('handlePlaybackShortcut', () => {
  it('handles Space even when a button has focus', () => {
    const event = keyboardEvent('Space', { tagName: 'BUTTON' })
    const actions = handlers()

    expect(handlePlaybackShortcut(event, actions)).toBe(true)
    expect(event.preventDefault).toHaveBeenCalledOnce()
    expect(actions.togglePlay).toHaveBeenCalledOnce()
  })

  it('defaults arrow keys to seeking 5 seconds', () => {
    expect(DEFAULT_SHORTCUT_OPTIONS).toEqual({ arrowKeyAction: 'seek', seekStep: 5 })

    const actions = handlers()
    handlePlaybackShortcut(keyboardEvent('ArrowRight', { tagName: 'DIV' }), actions)
    handlePlaybackShortcut(keyboardEvent('ArrowLeft', { tagName: 'DIV' }), actions)

    expect(actions.seekBy).toHaveBeenNthCalledWith(1, 5)
    expect(actions.seekBy).toHaveBeenNthCalledWith(2, -5)
    expect(actions.playNext).not.toHaveBeenCalled()
    expect(actions.playPrev).not.toHaveBeenCalled()
  })

  it('honours a custom seek step', () => {
    const actions = handlers()
    handlePlaybackShortcut(keyboardEvent('ArrowRight', { tagName: 'DIV' }), actions, {
      arrowKeyAction: 'seek',
      seekStep: 30
    })
    expect(actions.seekBy).toHaveBeenCalledWith(30)
  })

  it.each([
    ['ArrowLeft', 'playPrev'],
    ['ArrowRight', 'playNext']
  ] as const)('maps %s to %s in track mode', (code, action) => {
    const event = keyboardEvent(code, { tagName: 'DIV' })
    const actions = handlers()

    expect(handlePlaybackShortcut(event, actions, trackMode)).toBe(true)
    expect(event.preventDefault).toHaveBeenCalledOnce()
    expect(actions[action]).toHaveBeenCalledOnce()
    expect(actions.seekBy).not.toHaveBeenCalled()
  })

  it.each(['INPUT', 'TEXTAREA', 'SELECT'])('ignores %s targets', (tagName) => {
    const event = keyboardEvent('Space', { tagName })
    const actions = handlers()

    expect(handlePlaybackShortcut(event, actions)).toBe(false)
    expect(event.preventDefault).not.toHaveBeenCalled()
    expect(actions.togglePlay).not.toHaveBeenCalled()
  })

  it('ignores contenteditable targets and their descendants', () => {
    const actions = handlers()
    const editable = keyboardEvent('Space', { isContentEditable: true })
    const descendant = keyboardEvent('Space', {
      tagName: 'SPAN',
      closest: (selector: string) => selector === '[contenteditable="true"]' ? {} : null
    })

    expect(handlePlaybackShortcut(editable, actions)).toBe(false)
    expect(handlePlaybackShortcut(descendant, actions)).toBe(false)
    expect(actions.togglePlay).not.toHaveBeenCalled()
  })

  it('ignores held Space but allows held arrows to scrub', () => {
    const actions = handlers()

    expect(handlePlaybackShortcut(keyboardEvent('Space', { tagName: 'BUTTON' }, true), actions)).toBe(false)
    expect(actions.togglePlay).not.toHaveBeenCalled()

    expect(handlePlaybackShortcut(keyboardEvent('ArrowRight', { tagName: 'DIV' }, true), actions)).toBe(true)
    expect(actions.seekBy).toHaveBeenCalledWith(5)
  })

  it('ignores unmapped keys', () => {
    const actions = handlers()
    expect(handlePlaybackShortcut(keyboardEvent('ArrowUp', { tagName: 'DIV' }), actions)).toBe(false)
  })
})
