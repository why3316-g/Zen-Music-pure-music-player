<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { usePlaylistStore } from '../stores/playlist'
import { usePlayerStore } from '../stores/player'
import { scanFiles } from '../services/file-scanner'
import { audioEngine } from '../services/audio-engine'
import { formatTime } from '../utils/format'

const playlist = usePlaylistStore()
const player = usePlayerStore()

const showNewListInput = ref(false)
const newListName = ref('')
const showListDropdown = ref(false)

// Context menu state
const ctxMenu = ref<{
  visible: boolean
  x: number
  y: number
  index: number
}>({ visible: false, x: 0, y: 0, index: -1 })

// Drag reorder state
const dragIndex = ref(-1)
const dropTargetIdx = ref(-1)
const dropPos = ref<'before' | 'after' | null>(null)

const otherLists = computed(() =>
  playlist.lists.filter(l => l.id !== playlist.activeListId)
)

async function openFiles() {
  const paths = await window.api.openFiles()
  if (paths.length === 0) return
  const tracks = await scanFiles(paths)
  if (tracks.length === 0) return
  const shouldPlay = playlist.tracks.length === 0
  playlist.addTracks(tracks)
  if (shouldPlay && playlist.tracks[0]) {
    player.setTrack(playlist.tracks[0])
    await audioEngine.load(playlist.tracks[0].filePath)
    audioEngine.connectAnalyser()
  }
}

async function playTrack(index: number) {
  playlist.setCurrentIndex(index)
  const track = playlist.tracks[index]
  if (track) {
    player.setTrack(track)
    await audioEngine.load(track.filePath)
    audioEngine.connectAnalyser()
  }
}

function removeTrack(index: number) {
  playlist.removeTrack(index)
}

function createList() {
  const name = newListName.value.trim()
  if (!name) return
  playlist.createList(name)
  newListName.value = ''
  showNewListInput.value = false
  showListDropdown.value = false
}

function deleteList(id: string) {
  playlist.deleteList(id)
  showListDropdown.value = false
}

function switchList(id: string) {
  playlist.switchList(id)
  showListDropdown.value = false
}

// --- Context menu ---

async function onContextMenu(e: MouseEvent, index: number) {
  e.preventDefault()
  e.stopPropagation()
  ctxMenu.value = { visible: true, x: e.clientX, y: e.clientY, index }
  await nextTick()
  const el = document.querySelector('.ctx-menu') as HTMLElement
  if (!el) return
  const rect = el.getBoundingClientRect()
  let x = ctxMenu.value.x
  let y = ctxMenu.value.y
  if (x + rect.width > window.innerWidth - 4) x = window.innerWidth - rect.width - 4
  if (y + rect.height > window.innerHeight - 4) y = window.innerHeight - rect.height - 4
  if (x < 0) x = 4
  if (y < 0) y = 4
  ctxMenu.value.x = x
  ctxMenu.value.y = y
}

function closeCtx() {
  ctxMenu.value.visible = false
}

function ctxPlay() {
  playTrack(ctxMenu.value.index)
  closeCtx()
}

function ctxPlayNext() {
  const from = ctxMenu.value.index
  const ci = playlist.currentIndex
  if (from === ci) { closeCtx(); return }
  let to = ci + 1
  if (from < to) to--
  if (from !== to) playlist.moveTrack(from, to)
  closeCtx()
}

function ctxRemove() {
  removeTrack(ctxMenu.value.index)
  closeCtx()
}

function ctxMoveToList(listId: string) {
  playlist.moveTrackToList(ctxMenu.value.index, listId)
  closeCtx()
}

function ctxShowInFolder() {
  const track = playlist.tracks[ctxMenu.value.index]
  if (track) window.api.showInFolder(track.filePath)
  closeCtx()
}

// --- Drag reorder ---

function onTrackDragStart(e: DragEvent, index: number) {
  dragIndex.value = index
  e.dataTransfer!.setData('application/zen-music-track', String(index))
  e.dataTransfer!.effectAllowed = 'move'
  closeCtx()
}

function onTrackDragOver(e: DragEvent, index: number) {
  if (dragIndex.value === -1) return
  e.preventDefault()
  e.stopPropagation()
  e.dataTransfer!.dropEffect = 'move'
  const el = (e.target as HTMLElement).closest('.playlist__item') as HTMLElement
  if (!el) return
  const rect = el.getBoundingClientRect()
  const mid = rect.top + rect.height / 2
  dropTargetIdx.value = index
  dropPos.value = e.clientY < mid ? 'before' : 'after'
}

function onTrackDrop(e: DragEvent, targetIndex: number) {
  e.preventDefault()
  e.stopPropagation()
  if (dragIndex.value === -1 || !dropPos.value) return
  const from = dragIndex.value
  let to: number
  if (dropPos.value === 'before') {
    to = from < targetIndex ? targetIndex - 1 : targetIndex
  } else {
    to = from < targetIndex ? targetIndex : targetIndex + 1
  }
  if (from !== to) playlist.moveTrack(from, to)
  dragIndex.value = -1
  dropTargetIdx.value = -1
  dropPos.value = null
}

function onTrackDragEnd() {
  dragIndex.value = -1
  dropTargetIdx.value = -1
  dropPos.value = null
}

// --- File drag & drop on playlist ---

function onDragOver(e: DragEvent) {
  if (dragIndex.value !== -1) return
  e.preventDefault()
  e.dataTransfer!.dropEffect = 'copy'
}

async function onDrop(e: DragEvent) {
  e.preventDefault()
  if (dragIndex.value !== -1) return
  const files = e.dataTransfer?.files
  if (!files || files.length === 0) return
  const paths: string[] = []
  for (let i = 0; i < files.length; i++) {
    try {
      const path = window.api.getPathForFile(files[i])
      if (path) paths.push(path)
    } catch {}
  }
  if (paths.length === 0) return
  const tracks = await scanFiles(paths)
  if (tracks.length === 0) return
  const shouldPlay = playlist.tracks.length === 0
  playlist.addTracks(tracks)
  if (shouldPlay && playlist.tracks[0]) {
    player.setTrack(playlist.tracks[0])
    await audioEngine.load(playlist.tracks[0].filePath)
    audioEngine.connectAnalyser()
  }
}

// --- Lifecycle ---

function onDocClick() { closeCtx() }

onMounted(() => {
  document.addEventListener('click', onDocClick)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocClick)
})
</script>

<template>
  <div
    class="playlist"
    @dragover="onDragOver"
    @drop="onDrop"
  >
    <!-- List selector dropdown -->
    <div class="playlist__selector">
      <button class="selector-btn" @click="showListDropdown = !showListDropdown">
        <span class="selector-btn__name">{{ playlist.currentListName }}</span>
        <span class="selector-btn__count">{{ playlist.tracks.length }}首</span>
        <svg class="selector-btn__arrow" :class="{ 'selector-btn__arrow--open': showListDropdown }" width="10" height="6" viewBox="0 0 10 6">
          <path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <button class="add-btn" @click="openFiles" title="添加音乐">+</button>
    </div>

    <!-- Dropdown list -->
    <div class="selector-dropdown" v-if="showListDropdown">
      <div
        v-for="list in playlist.lists"
        :key="list.id"
        class="selector-dropdown__item"
        :class="{ 'selector-dropdown__item--active': list.id === playlist.activeListId }"
        @click="switchList(list.id)"
      >
        <span>{{ list.name }}</span>
        <span class="selector-dropdown__count">{{ list.tracks.length }}首</span>
        <button
          v-if="playlist.lists.length > 1"
          class="selector-dropdown__delete"
          @click.stop="deleteList(list.id)"
        >✕</button>
      </div>
      <div class="selector-dropdown__new" @click="showNewListInput = true; showListDropdown = false">+ 新建列表</div>
    </div>

    <!-- New list input -->
    <div class="playlist__new-list" v-if="showNewListInput">
      <input
        v-model="newListName"
        placeholder="列表名称..."
        class="new-list-input"
        @keyup.enter="createList"
        autofocus
      />
      <button class="new-list-btn" @click="createList">创建</button>
    </div>

    <!-- Empty state -->
    <div class="playlist__empty" v-if="playlist.tracks.length === 0">
      <p>拖拽音乐文件到此处</p>
      <button class="playlist__add-btn" @click="openFiles">添加音乐</button>
    </div>

    <!-- Track list -->
    <div class="playlist__list" v-else>
      <div
        v-for="(track, i) in playlist.tracks"
        :key="track.filePath + i"
        class="playlist__item"
        :class="{
          'playlist__item--active': i === playlist.currentIndex,
          'playlist__item--dragging': dragIndex === i,
          'playlist__item--drop-before': dropTargetIdx === i && dropPos === 'before' && dragIndex !== i,
          'playlist__item--drop-after': dropTargetIdx === i && dropPos === 'after' && dragIndex !== i
        }"
        draggable="true"
        @click="playTrack(i)"
        @contextmenu="onContextMenu($event, i)"
        @dragstart="onTrackDragStart($event, i)"
        @dragover="onTrackDragOver($event, i)"
        @drop="onTrackDrop($event, i)"
        @dragend="onTrackDragEnd"
      >
        <div class="playlist__item-index">
          <span v-if="i === playlist.currentIndex && player.isPlaying">♪</span>
          <span v-else>{{ i + 1 }}</span>
        </div>
        <div class="playlist__item-meta">
          <div class="playlist__item-title">{{ track.title }}</div>
          <div class="playlist__item-artist">{{ track.artist }}</div>
        </div>
        <span class="playlist__item-duration">{{ formatTime(track.duration) }}</span>
        <button class="playlist__item-remove" @click.stop="removeTrack(i)">✕</button>
      </div>
    </div>

    <!-- Right-click context menu -->
    <Teleport to="body">
      <div
        v-if="ctxMenu.visible"
        class="ctx-menu"
        :style="{ left: ctxMenu.x + 'px', top: ctxMenu.y + 'px' }"
        @click.stop
      >
        <div class="ctx-menu__item" @click="ctxPlay">
          <span class="ctx-menu__icon">▶</span> 播放
        </div>
        <div class="ctx-menu__item" @click="ctxPlayNext" :class="{ 'ctx-menu__item--disabled': ctxMenu.index === playlist.currentIndex }">
          <span class="ctx-menu__icon">⏭</span> 下一首播放
        </div>
        <div class="ctx-menu__sep"></div>
        <div class="ctx-menu__item ctx-menu__item--parent" v-if="otherLists.length > 0">
          <span class="ctx-menu__icon">↗</span> 移动到...
          <div class="ctx-menu__sub">
            <div
              v-for="list in otherLists"
              :key="list.id"
              class="ctx-menu__item"
              @click="ctxMoveToList(list.id)"
            >
              {{ list.name }} ({{ list.tracks.length }}首)
            </div>
          </div>
        </div>
        <div class="ctx-menu__item ctx-menu__item--disabled" v-else>
          <span class="ctx-menu__icon">↗</span> 移动到...
        </div>
        <div class="ctx-menu__sep"></div>
        <div class="ctx-menu__item ctx-menu__item--danger" @click="ctxRemove">
          <span class="ctx-menu__icon">✕</span> 从列表中删除
        </div>
        <div class="ctx-menu__sep"></div>
        <div class="ctx-menu__item" @click="ctxShowInFolder">
          <span class="ctx-menu__icon">📁</span> 在文件管理器中显示
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.playlist {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
}

/* List selector */
.playlist__selector {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border, rgba(255, 255, 255, 0.06));
}

.selector-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border: 1px solid var(--border, rgba(255, 255, 255, 0.1));
  border-radius: 8px;
  background: transparent;
  color: var(--text-primary, #fff);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.selector-btn:hover {
  background: rgba(255, 255, 255, 0.05);
}

.selector-btn__name {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.selector-btn__count {
  font-weight: 400;
  opacity: 0.4;
  font-size: 11px;
}

.selector-btn__arrow {
  opacity: 0.4;
  transition: transform 0.2s;
}

.selector-btn__arrow--open {
  transform: rotate(180deg);
}

.add-btn {
  border: none;
  background: none;
  color: var(--text-primary, #fff);
  cursor: pointer;
  font-size: 18px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: background 0.15s;
}

.add-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* Dropdown */
.selector-dropdown {
  position: absolute;
  top: 46px;
  left: 12px;
  right: 12px;
  background: var(--bg-elevated, rgba(30, 30, 50, 0.98));
  border: 1px solid var(--border, rgba(255, 255, 255, 0.1));
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  z-index: 20;
  overflow: hidden;
}

.selector-dropdown__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  cursor: pointer;
  font-size: 12px;
  color: var(--text-secondary, #ccc);
  transition: background 0.1s;
}

.selector-dropdown__item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.selector-dropdown__item--active {
  color: var(--accent, #667eea);
  font-weight: 600;
}

.selector-dropdown__count {
  flex: 1;
  text-align: right;
  opacity: 0.4;
  font-size: 11px;
}

.selector-dropdown__delete {
  border: none;
  background: none;
  color: rgba(255, 255, 255, 0.2);
  cursor: pointer;
  font-size: 10px;
  padding: 2px 4px;
  border-radius: 3px;
}

.selector-dropdown__delete:hover {
  color: #e81123;
}

.selector-dropdown__new {
  padding: 10px 14px;
  font-size: 12px;
  color: var(--text-tertiary, #888);
  cursor: pointer;
  border-top: 1px solid var(--border, rgba(255, 255, 255, 0.06));
  transition: background 0.1s;
}

.selector-dropdown__new:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-secondary, #ccc);
}

/* New list input */
.playlist__new-list {
  display: flex;
  gap: 6px;
  padding: 6px 12px;
  border-bottom: 1px solid var(--border, rgba(255, 255, 255, 0.06));
}

.new-list-input {
  flex: 1;
  padding: 4px 8px;
  border: 1px solid var(--border, rgba(255, 255, 255, 0.1));
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.2);
  color: var(--text-primary, #fff);
  font-size: 12px;
  outline: none;
}

.new-list-input:focus {
  border-color: var(--accent, #667eea);
}

.new-list-btn {
  padding: 4px 12px;
  border: none;
  border-radius: 6px;
  background: var(--accent, #667eea);
  color: white;
  font-size: 12px;
  cursor: pointer;
}

/* Empty state */
.playlist__empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  opacity: 0.4;
}

.playlist__empty p {
  font-size: 13px;
}

.playlist__add-btn {
  padding: 8px 20px;
  border: 1px dashed rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: transparent;
  color: var(--text-primary, #fff);
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s;
}

.playlist__add-btn:hover {
  background: rgba(255, 255, 255, 0.05);
}

/* Track list */
.playlist__list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
}

.playlist__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  cursor: pointer;
  transition: background 0.15s;
  user-select: none;
}

.playlist__item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.playlist__item--active {
  background: var(--accent-soft, rgba(102, 126, 234, 0.15));
}

.playlist__item--active .playlist__item-title {
  color: var(--accent, #667eea);
}

.playlist__item--dragging {
  opacity: 0.3;
}

.playlist__item--drop-before {
  box-shadow: inset 0 2px 0 0 var(--accent, #667eea);
}

.playlist__item--drop-after {
  box-shadow: inset 0 -2px 0 0 var(--accent, #667eea);
}

.playlist__item-index {
  width: 24px;
  text-align: center;
  font-size: 12px;
  opacity: 0.4;
  flex-shrink: 0;
}

.playlist__item--active .playlist__item-index {
  opacity: 1;
  color: var(--accent, #667eea);
}

.playlist__item-meta {
  flex: 1;
  min-width: 0;
}

.playlist__item-title {
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.playlist__item-artist {
  font-size: 11px;
  opacity: 0.4;
}

.playlist__item-duration {
  font-size: 11px;
  opacity: 0.4;
  flex-shrink: 0;
}

.playlist__item-remove {
  border: none;
  background: none;
  color: rgba(255, 255, 255, 0.3);
  cursor: pointer;
  font-size: 12px;
  padding: 4px;
  border-radius: 4px;
  opacity: 0;
  transition: opacity 0.15s;
  flex-shrink: 0;
}

.playlist__item:hover .playlist__item-remove {
  opacity: 1;
}

.playlist__item-remove:hover {
  color: #e81123;
}
</style>

<style>
/* Context menu — global scope (Teleport renders outside component) */
.ctx-menu {
  position: fixed;
  min-width: 180px;
  background: var(--bg-elevated, rgba(30, 30, 50, 0.98));
  border: 1px solid var(--border, rgba(255, 255, 255, 0.1));
  border-radius: 10px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
  z-index: 9999;
  padding: 4px 0;
  user-select: none;
}

.ctx-menu__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  font-size: 13px;
  color: var(--text-secondary, #ccc);
  cursor: pointer;
  transition: background 0.1s;
  white-space: nowrap;
  position: relative;
}

.ctx-menu__item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.ctx-menu__item--disabled {
  opacity: 0.35;
  cursor: default;
  pointer-events: none;
}

.ctx-menu__item--danger:hover {
  background: rgba(232, 17, 35, 0.15);
  color: #e81123;
}

.ctx-menu__icon {
  width: 18px;
  text-align: center;
  font-size: 12px;
  opacity: 0.6;
  flex-shrink: 0;
}

.ctx-menu__sep {
  height: 1px;
  margin: 4px 12px;
  background: var(--border, rgba(255, 255, 255, 0.08));
}

/* Submenu */
.ctx-menu__item--parent:hover > .ctx-menu__sub {
  display: block;
}

.ctx-menu__sub {
  display: none;
  position: absolute;
  left: 100%;
  top: -4px;
  min-width: 160px;
  background: var(--bg-elevated, rgba(30, 30, 50, 0.98));
  border: 1px solid var(--border, rgba(255, 255, 255, 0.1));
  border-radius: 10px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
  padding: 4px 0;
}
</style>
