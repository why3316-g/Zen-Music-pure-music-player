import { describe, expect, it, vi } from 'vitest'
import { handlePlaybackShortcut } from './playback-shortcuts'

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
    playNext: vi.fn()
  }
}

describe('handlePlaybackShortcut', () => {
  it('handles Space even when a button has focus', () => {
    const event = keyboardEvent('Space', { tagName: 'BUTTON' })
    const actions = handlers()

    expect(handlePlaybackShortcut(event, actions)).toBe(true)
    expect(event.preventDefault).toHaveBeenCalledOnce()
    expect(actions.togglePlay).toHaveBeenCalledOnce()
  })

  it.each([
    ['ArrowLeft', 'playPrev'],
    ['ArrowRight', 'playNext']
  ] as const)('maps %s to %s', (code, action) => {
    const event = keyboardEvent(code, { tagName: 'DIV' })
    const actions = handlers()

    expect(handlePlaybackShortcut(event, actions)).toBe(true)
    expect(event.preventDefault).toHaveBeenCalledOnce()
    expect(actions[action]).toHaveBeenCalledOnce()
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

  it('ignores repeated and unmapped keydowns', () => {
    const actions = handlers()

    expect(handlePlaybackShortcut(keyboardEvent('Space', { tagName: 'BUTTON' }, true), actions)).toBe(false)
    expect(handlePlaybackShortcut(keyboardEvent('ArrowUp', { tagName: 'DIV' }), actions)).toBe(false)
    expect(actions.togglePlay).not.toHaveBeenCalled()
  })
})
