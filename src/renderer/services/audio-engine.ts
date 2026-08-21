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
  /** 视频画面的挂载点，由 VideoPlayer 注册；为空时 media 回到隐藏容器 */
  private videoContainer: HTMLElement | null = null
  private loadedPath: string | null = null
  private volumeValue = 1

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

  /** 当前已加载的文件路径，未加载时为 null */
  get currentPath() {
    return this.loadedPath
  }

  /**
   * 加载并播放文件。
   * 已经是当前文件时不重新设 src，只定位——重复打开同一个视频不会丢画面。
   */
  async load(filePath: string, startTime = 0) {
    const isSameSource = this.loadedPath === filePath

    if (!isSameSource) {
      this.media.pause()
      this.media.src = window.api.toAppUrl(filePath)
      this.media.load()
      this.loadedPath = filePath
    }

    // 先摆好画面位置再播放，避免播放中途搬 DOM 被浏览器暂停
    this.applyPlacement()
    this.media.volume = this.volumeValue

    if (startTime > 0) {
      await this.waitForMetadata()
      this.safeSeek(startTime)
    } else if (isSameSource) {
      this.safeSeek(0)
    }

    await this.media.play()
    this.ensureAudioContext()
  }

  async play() {
    this.applyPlacement()
    await this.media.play()
    this.ensureAudioContext()
  }

  pause() {
    this.media.pause()
  }

  seek(time: number) {
    this.safeSeek(time)
  }

  /** 相对当前位置快进/后退，返回落点秒数 */
  seekBy(deltaSeconds: number): number {
    const duration = this.duration
    let target = this.media.currentTime + deltaSeconds
    target = Math.max(0, duration > 0 ? Math.min(target, duration) : target)
    this.safeSeek(target)
    return target
  }

  setVolume(v: number) {
    this.volumeValue = Math.max(0, Math.min(1, v))
    this.media.volume = this.volumeValue
  }

  get volume() {
    return this.volumeValue
  }

  get currentTime() {
    return this.media.currentTime
  }

  get duration() {
    return Number.isFinite(this.media.duration) ? this.media.duration : 0
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

  /**
   * 注册/注销视频画面容器。VideoPlayer 挂载时传入元素，卸载时传 null。
   * 位置由引擎统一维护，因此换曲、重复打开同一个文件都不会丢画面。
   */
  setVideoContainer(container: HTMLElement | null) {
    this.videoContainer = container
    this.applyPlacement()
  }

  /** Move media element back to the hidden home container */
  returnMedia() {
    this.videoContainer = null
    this.applyPlacement()
  }

  /** 把 media 元素放到当前该在的位置（视频容器或隐藏容器） */
  private applyPlacement() {
    const target = this.videoContainer ?? this.home
    const isVideoSurface = target !== this.home

    if (this.media.parentElement !== target) {
      const wasPlaying = !this.media.paused
      target.appendChild(this.media)
      // 搬动后个别情况下 Chromium 会暂停，播放中的要接回去
      if (wasPlaying && this.media.paused) void this.media.play().catch(() => {})
    }

    if (isVideoSurface) {
      this.media.style.width = '100%'
      this.media.style.height = '100%'
      this.media.style.objectFit = 'contain'
      this.media.style.background = '#000'
      this.media.style.display = 'block'
    } else {
      this.media.style.display = 'none'
    }
  }

  private safeSeek(time: number) {
    try {
      this.media.currentTime = time
    } catch {
      // readyState 还没到可定位时忽略，metadata 就绪后调用方会重试
    }
  }

  private waitForMetadata(): Promise<void> {
    if (this.media.readyState >= 1) return Promise.resolve()
    return new Promise((resolve) => {
      const done = () => {
        this.media.removeEventListener('loadedmetadata', done)
        this.media.removeEventListener('error', done)
        resolve()
      }
      this.media.addEventListener('loadedmetadata', done)
      this.media.addEventListener('error', done)
    })
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
    this.loadedPath = null
  }
}

export const audioEngine = new AudioEngine()
