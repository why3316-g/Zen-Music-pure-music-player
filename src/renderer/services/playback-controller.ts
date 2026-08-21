import { usePlaylistStore } from '../stores/playlist'
import { usePlayerStore } from '../stores/player'
import { useSettingsStore } from '../stores/settings'
import { scanFiles } from './file-scanner'
import { audioEngine } from './audio-engine'
import { playbackMemory } from './playback-memory'
import { pickNextIndex, pickPrevIndex } from '../utils/play-order'

interface PlayOptions {
  /** 用户主动挑的这首（双击文件、点列表），才考虑"接着上次"的设置 */
  fromUserPick?: boolean
}

/** 播放列表里第 index 首 */
export async function playAt(index: number, options: PlayOptions = {}) {
  const playlist = usePlaylistStore()
  const player = usePlayerStore()
  const settings = useSettingsStore()

  const track = playlist.tracks[index]
  if (!track) return

  playlist.setCurrentIndex(index)
  player.setTrack(track)
  audioEngine.connectAnalyser()

  const shouldResume = options.fromUserPick && settings.reopenBehavior === 'resume'
  const startTime = shouldResume ? playbackMemory.get(track.filePath, track.duration) : 0

  await audioEngine.load(track.filePath, startTime)
  if (startTime > 0) player.seek(startTime)
}

/**
 * 添加文件并按需播放。
 * 同一个文件在列表里只会有一条：已存在的直接跳过去播，不再追加。
 */
export async function openFiles(filePaths: string[], options: { autoPlay?: boolean } = {}) {
  const playlist = usePlaylistStore()
  if (filePaths.length === 0) return

  const wasEmpty = playlist.tracks.length === 0
  const targetPath = filePaths[0]
  const targetWasInList = playlist.indexOfPath(targetPath) !== -1

  const newPaths = [...new Set(filePaths)].filter(p => playlist.indexOfPath(p) === -1)
  if (newPaths.length > 0) {
    const tracks = await scanFiles(newPaths)
    playlist.addTracks(tracks)
  }

  const targetIdx = playlist.indexOfPath(targetPath)
  if (targetIdx === -1) return

  if (options.autoPlay || wasEmpty) {
    await playAt(targetIdx, { fromUserPick: targetWasInList })
  }
}

export async function playNext() {
  const playlist = usePlaylistStore()
  const player = usePlayerStore()
  const idx = pickNextIndex(playlist.tracks.length, playlist.currentIndex, player.playMode)
  if (idx >= 0) await playAt(idx)
}

export async function playPrev() {
  const playlist = usePlaylistStore()
  const player = usePlayerStore()
  const idx = pickPrevIndex(playlist.tracks.length, playlist.currentIndex, player.playMode)
  if (idx >= 0) await playAt(idx)
}
