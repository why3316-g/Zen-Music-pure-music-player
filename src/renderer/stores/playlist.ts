import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { TrackInfo } from '../utils/types'
import { dedupeTracks, filterNewTracks } from '../utils/playlist-dedupe'

interface PlayList {
  id: string
  name: string
  tracks: TrackInfo[]
  currentIndex: number
}

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

export const usePlaylistStore = defineStore('playlist', () => {
  const lists = ref<PlayList[]>([
    { id: uid(), name: '默认列表', tracks: [], currentIndex: -1 }
  ])
  const activeListId = ref(lists.value[0].id)

  const activeList = computed(() =>
    lists.value.find(l => l.id === activeListId.value) || lists.value[0]
  )

  const tracks = computed(() => activeList.value.tracks)
  const currentIndex = computed({
    get: () => activeList.value.currentIndex,
    set: (v: number) => { activeList.value.currentIndex = v }
  })
  const currentTrack = computed(() =>
    currentIndex.value >= 0 ? tracks.value[currentIndex.value] : null
  )
  const currentListName = computed(() => activeList.value.name)

  /** 当前列表里该文件的位置，不存在返回 -1 */
  function indexOfPath(filePath: string): number {
    return activeList.value.tracks.findIndex(t => t.filePath === filePath)
  }

  /**
   * 追加曲目，同一个文件在一个列表里只保留一条。
   * 返回真正被加进去的曲目数量。
   */
  function addTracks(newTracks: TrackInfo[]): number {
    const list = activeList.value
    const added = filterNewTracks(list.tracks, newTracks)
    if (added.length === 0) return 0

    const startIdx = list.tracks.length
    list.tracks.push(...added)
    if (list.currentIndex === -1) {
      list.currentIndex = startIdx
    }
    return added.length
  }

  function removeTrack(index: number) {
    const list = activeList.value
    list.tracks.splice(index, 1)
    if (list.tracks.length === 0) {
      list.currentIndex = -1
    } else if (index < list.currentIndex) {
      list.currentIndex--
    } else if (index === list.currentIndex) {
      list.currentIndex = Math.min(list.currentIndex, list.tracks.length - 1)
    }
  }

  function removeTracks(indices: number[]) {
    if (indices.length === 0) return
    const list = activeList.value
    const indexSet = new Set(indices)
    const ci = list.currentIndex
    const removedBefore = indices.filter(i => i < ci).length
    const isCurrentRemoved = indexSet.has(ci)
    list.tracks = list.tracks.filter((_, i) => !indexSet.has(i))
    if (list.tracks.length === 0) {
      list.currentIndex = -1
    } else if (isCurrentRemoved) {
      list.currentIndex = Math.min(ci - removedBefore, list.tracks.length - 1)
    } else {
      list.currentIndex = ci - removedBefore
    }
  }

  function clear() {
    const list = activeList.value
    list.tracks = []
    list.currentIndex = -1
  }

  function setCurrentIndex(index: number) {
    const list = activeList.value
    if (index >= 0 && index < list.tracks.length) {
      list.currentIndex = index
    }
  }

  function createList(name: string) {
    const list: PlayList = { id: uid(), name, tracks: [], currentIndex: -1 }
    lists.value.push(list)
    activeListId.value = list.id
  }

  function deleteList(id: string) {
    if (lists.value.length <= 1) return
    const idx = lists.value.findIndex(l => l.id === id)
    if (idx === -1) return
    lists.value.splice(idx, 1)
    if (activeListId.value === id) {
      activeListId.value = lists.value[0].id
    }
  }

  function switchList(id: string) {
    const list = lists.value.find(l => l.id === id)
    if (list) activeListId.value = id
  }

  function moveTrack(fromIndex: number, toIndex: number) {
    const list = activeList.value
    if (fromIndex === toIndex) return
    const [track] = list.tracks.splice(fromIndex, 1)
    list.tracks.splice(toIndex, 0, track)

    const ci = list.currentIndex
    if (ci < 0) return
    if (ci === fromIndex) {
      list.currentIndex = toIndex
    } else {
      let newCi = ci
      if (fromIndex < ci) newCi--
      if (toIndex <= newCi) newCi++
      list.currentIndex = newCi
    }
  }

  function moveTrackToList(trackIndex: number, targetListId: string) {
    const sourceList = activeList.value
    const targetList = lists.value.find(l => l.id === targetListId)
    if (!targetList || sourceList.id === targetListId) return
    const [track] = sourceList.tracks.splice(trackIndex, 1)
    // 目标列表已经有这个文件就直接丢弃，保持"一个文件一条"
    if (!targetList.tracks.some(t => t.filePath === track.filePath)) {
      targetList.tracks.push(track)
    }
    if (sourceList.tracks.length === 0) {
      sourceList.currentIndex = -1
    } else if (trackIndex < sourceList.currentIndex) {
      sourceList.currentIndex--
    } else if (trackIndex === sourceList.currentIndex) {
      sourceList.currentIndex = Math.min(sourceList.currentIndex, sourceList.tracks.length - 1)
    }
  }

  /** Serialize for persistence */
  function toJSON() {
    return { lists: lists.value, activeListId: activeListId.value }
  }

  /** Restore from persistence，顺手清洗历史存档里已经重复的条目 */
  function fromJSON(data: { lists: PlayList[]; activeListId: string }): number {
    if (!data?.lists?.length) return 0

    let removed = 0
    lists.value = data.lists.map(list => {
      const cleaned = dedupeTracks(list.tracks ?? [], list.currentIndex ?? -1)
      removed += cleaned.removed
      return { ...list, tracks: cleaned.tracks, currentIndex: cleaned.currentIndex }
    })
    activeListId.value = data.activeListId || lists.value[0].id
    return removed
  }

  return {
    lists, activeListId, tracks, currentIndex, currentTrack, currentListName,
    addTracks, removeTrack, removeTracks, clear, setCurrentIndex, indexOfPath,
    createList, deleteList, switchList, moveTrack, moveTrackToList, toJSON, fromJSON
  }
})
