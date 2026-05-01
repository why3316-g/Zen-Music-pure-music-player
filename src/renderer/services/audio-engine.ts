type AudioCallback = () => void
type TimeCallback = (time: number) => void

class AudioEngine {
  private media: HTMLMediaElement
  private audioCtx: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private sourceNode: MediaElementAudioSourceNode | null = null
  private onEndedCb: AudioCallback | null = null
  private onTimeUpdateCb: TimeCallback | null = null

  constructor() {
    this.media = document.createElement('video')
    this.media.addEventListener('ended', () => this.onEndedCb?.())
    this.media.addEventListener('timeupdate', () => {
      this.onTimeUpdateCb?.(this.media.currentTime)
    })
  }

  async load(filePath: string) {
    const url = window.api.toAppUrl(filePath)
    this.media.src = url
    this.media.load()
    await this.media.play()
  }

  play() {
    return this.media.play()
  }

  pause() {
    this.media.pause()
  }

  seek(time: number) {
    this.media.currentTime = time
  }

  setVolume(v: number) {
    this.media.volume = v
  }

  get currentTime() {
    return this.media.currentTime
  }

  get duration() {
    return this.media.duration || 0
  }

  get playing() {
    return !this.media.paused
  }

  onEnded(cb: AudioCallback) {
    this.onEndedCb = cb
  }

  onTimeUpdate(cb: TimeCallback) {
    this.onTimeUpdateCb = cb
  }

  getAnalyser(): AnalyserNode | null {
    return this.analyser
  }

  /** Initialize audio pipeline once. Safe to call multiple times. */
  connectAnalyser() {
    if (this.sourceNode) return

    this.audioCtx = new AudioContext()
    this.analyser = this.audioCtx.createAnalyser()
    this.analyser.fftSize = 256
    this.sourceNode = this.audioCtx.createMediaElementSource(this.media)
    this.sourceNode.connect(this.analyser)
    this.analyser.connect(this.audioCtx.destination)
  }

  destroy() {
    this.media.src = ''
  }
}

export const audioEngine = new AudioEngine()
