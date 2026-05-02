type AudioCallback = () => void
type TimeCallback = (time: number) => void

class AudioEngine {
  private media: HTMLMediaElement
  private audioCtx: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private sourceNode: MediaElementAudioSourceNode | null = null
  private onEndedCb: AudioCallback | null = null
  private onTimeUpdateCb: TimeCallback | null = null
  private home: HTMLDivElement

  constructor() {
    this.media = document.createElement('video')
    this.media.preload = 'auto'
    this.media.addEventListener('ended', () => this.onEndedCb?.())
    this.media.addEventListener('timeupdate', () => {
      this.onTimeUpdateCb?.(this.media.currentTime)
    })

    // Keep media element always in DOM to avoid Chromium playback issues
    this.home = document.createElement('div')
    this.home.style.display = 'none'
    this.home.appendChild(this.media)
    document.body.appendChild(this.home)
  }

  get currentSrc() {
    return this.media.currentSrc
  }

  async load(filePath: string) {
    // Move media back to home container (detaches from VideoPlayer)
    this.returnMedia()
    this.media.pause()

    const url = window.api.toAppUrl(filePath)
    this.media.src = url
    this.media.load()
    await this.media.play()
    this.ensureAudioContext()
  }

  async play() {
    await this.media.play()
    this.ensureAudioContext()
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

  getMediaElement(): HTMLMediaElement {
    return this.media
  }

  /** Move media element back to the hidden home container */
  returnMedia() {
    if (this.media.parentElement !== this.home) {
      this.media.style.display = 'none'
      this.home.appendChild(this.media)
    }
  }

  /** Ensure AudioContext is running (browsers suspend it until user gesture) */
  private ensureAudioContext() {
    if (!this.audioCtx) return
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume()
    }
  }

  /** Initialize audio pipeline once. Safe to call multiple times. */
  connectAnalyser() {
    if (this.sourceNode) return

    this.audioCtx = new AudioContext()
    this.analyser = this.audioCtx.createAnalyser()
    this.analyser.fftSize = 256
    this.analyser.smoothingTimeConstant = 0.8
    this.sourceNode = this.audioCtx.createMediaElementSource(this.media)
    this.sourceNode.connect(this.analyser)
    this.analyser.connect(this.audioCtx.destination)
    this.ensureAudioContext()
  }

  destroy() {
    this.media.src = ''
  }
}

export const audioEngine = new AudioEngine()
