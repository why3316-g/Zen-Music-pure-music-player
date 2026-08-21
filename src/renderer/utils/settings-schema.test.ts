import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SETTINGS,
  SETTINGS_KEY,
  normalizeSettings,
  readSettings
} from './settings-schema'

describe('normalizeSettings', () => {
  it('returns defaults for empty or invalid input', () => {
    expect(normalizeSettings(null)).toEqual(DEFAULT_SETTINGS)
    expect(normalizeSettings('nonsense')).toEqual(DEFAULT_SETTINGS)
    expect(normalizeSettings({})).toEqual(DEFAULT_SETTINGS)
  })

  it('keeps valid values', () => {
    const saved = {
      arrowKeyAction: 'track',
      seekStep: 30,
      reopenBehavior: 'resume',
      playlistAutoHide: false,
      startupPlayMode: 'shuffle',
      startupVolumeMode: 'fixed',
      defaultVolume: 0.35
    }
    expect(normalizeSettings(saved)).toEqual(saved)
  })

  it('falls back on out-of-range or unknown values', () => {
    const result = normalizeSettings({
      arrowKeyAction: 'jump',
      seekStep: 7,
      reopenBehavior: 42,
      startupPlayMode: 'reverse',
      startupVolumeMode: null,
      defaultVolume: 'loud'
    })
    expect(result).toEqual(DEFAULT_SETTINGS)
  })

  it('clamps volume into 0..1', () => {
    expect(normalizeSettings({ defaultVolume: 3 }).defaultVolume).toBe(1)
    expect(normalizeSettings({ defaultVolume: -2 }).defaultVolume).toBe(0)
  })

  it('defaults arrow keys to seeking by 5 seconds', () => {
    expect(DEFAULT_SETTINGS.arrowKeyAction).toBe('seek')
    expect(DEFAULT_SETTINGS.seekStep).toBe(5)
  })
})

describe('readSettings', () => {
  it('reads and normalizes stored JSON', () => {
    const storage = {
      getItem: (k: string) => (k === SETTINGS_KEY ? '{"seekStep":10}' : null)
    }
    expect(readSettings(storage).seekStep).toBe(10)
  })

  it('survives corrupted JSON', () => {
    const storage = { getItem: () => '{broken' }
    expect(readSettings(storage)).toEqual(DEFAULT_SETTINGS)
  })
})
