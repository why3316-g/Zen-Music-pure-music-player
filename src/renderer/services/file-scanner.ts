import type { TrackInfo } from '../utils/types'
import { parseBuffer } from 'music-metadata'

export async function scanFiles(filePaths: string[]): Promise<TrackInfo[]> {
  const tracks: TrackInfo[] = []

  for (const filePath of filePaths) {
    try {
      const buffer = await window.api.readBuffer(filePath)
      if (!buffer) continue

      const metadata = await parseBuffer(new Uint8Array(buffer as ArrayBuffer))

      const title = metadata.common.title || filePath.replace(/^.*[\\/]/, '')
      const artist = metadata.common.artist || 'Unknown'
      const album = metadata.common.album || 'Unknown'
      const duration = metadata.format.duration || 0

      let coverUrl: string | undefined
      if (metadata.common.picture?.[0]) {
        const pic = metadata.common.picture[0]
        const blob = new Blob([pic.data], { type: pic.format })
        coverUrl = URL.createObjectURL(blob)
      }

      tracks.push({ filePath, title, artist, album, duration, coverUrl })
    } catch {
      const fileName = filePath.replace(/^.*[\\/]/, '')
      tracks.push({ filePath, title: fileName, artist: 'Unknown', album: 'Unknown', duration: 0 })
    }
  }

  return tracks
}
