export interface TrackInfo {
  filePath: string
  title: string
  artist: string
  album: string
  duration: number
  coverUrl?: string
}

export type PlayMode = 'single' | 'loop' | 'shuffle'

export interface PlayerState {
  currentTrack: TrackInfo | null
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  playMode: PlayMode
}
