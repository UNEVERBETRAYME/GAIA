<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { formatTime, getState, nextTrack, prevTrack, restoreState, seekToTime, setVolume, subscribe, togglePlay } from '../js/music-player.js'

const navItems = [
  { to: '/', label: '首页' },
  { to: '/translate', label: '翻译' },
  { to: '/words', label: '文字' },
  { to: '/ai', label: 'RELIC' },
  { to: '/music', label: '音乐' },
]

const playerState = ref(getState())
let unsubscribePlayer = null

const isMinimized = ref(true)
const playerPos = ref({ x: 0, y: 0 })
const isDragging = ref(false)
let dragStart = { x: 0, y: 0, left: 0, top: 0 }

function toggleMinimized() {
  isMinimized.value = !isMinimized.value
}

function onPlayerDragStart(e) {
  if (e.target.closest('button') || e.target.closest('input')) return
  isDragging.value = true
  const rect = e.currentTarget.getBoundingClientRect()
  dragStart = {
    x: e.clientX,
    y: e.clientY,
    left: playerPos.value.x || rect.left,
    top: playerPos.value.y || rect.top,
  }
  e.currentTarget.style.transition = 'none'
}

function onPlayerDragMove(e) {
  if (!isDragging.value) return
  const dx = e.clientX - dragStart.x
  const dy = e.clientY - dragStart.y
  playerPos.value = {
    x: Math.max(0, Math.min(window.innerWidth - 300, dragStart.left + dx)),
    y: Math.max(0, Math.min(window.innerHeight - 60, dragStart.top + dy)),
  }
}

function onPlayerDragEnd(e) {
  isDragging.value = false
  e.currentTarget.style.transition = ''
}

const playerStyle = computed(() => {
  if (playerPos.value.x || playerPos.value.y) {
    return {
      position: 'fixed',
      left: playerPos.value.x + 'px',
      top: playerPos.value.y + 'px',
      bottom: 'auto',
    }
  }
  return {}
})

const hasMiniPlayer = computed(() => !!playerState.value.song)
const progressPercent = computed(() => {
  const d = playerState.value.duration || 0
  const t = playerState.value.currentTime || 0
  if (!d) return 0
  return Math.max(0, Math.min(100, (t / d) * 100))
})

function onSeekBarClick(e) {
  const el = e.currentTarget
  if (!el) return
  const state = playerState.value
  if (!state.duration) return
  const rect = el.getBoundingClientRect()
  const percent = (e.clientX - rect.left) / rect.width
  const nextTime = Math.max(0, Math.min(1, percent)) * state.duration
  seekToTime(nextTime)
}

function onVolumeInput(e) {
  const v = Number(e.target?.value ?? 0)
  if (!Number.isFinite(v)) return
  setVolume(Math.max(0, Math.min(1, v / 100)))
}

onMounted(() => {
  restoreState()
  playerState.value = getState()
  unsubscribePlayer = subscribe((s) => {
    playerState.value = s
  })
})

onBeforeUnmount(() => {
  if (typeof unsubscribePlayer === 'function') unsubscribePlayer()
  unsubscribePlayer = null
})
</script>

<template>
  <div class="app-shell" :class="{ 'app-shell--has-player': hasMiniPlayer }">
    <header class="app-shell__nav">
      <div class="app-shell__nav-inner glass glass--surface">
        <div class="app-shell__brand">
          <RouterLink class="app-shell__brand-link" to="/">GAIA</RouterLink>
        </div>

        <nav class="app-shell__links" aria-label="主导航">
          <RouterLink
            v-for="item in navItems"
            :key="item.to"
            class="app-shell__link"
            :to="item.to"
            active-class="is-active"
          >
            {{ item.label }}
          </RouterLink>
        </nav>
      </div>
    </header>

    <main class="app-shell__main">
      <div class="app-shell__content">
        <RouterView v-slot="{ Component }">
          <transition name="route-fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </RouterView>
      </div>
    </main>

      <div v-if="hasMiniPlayer" class="mini-player" :class="{ 'mini-player--minimized': isMinimized, 'mini-player--dragging': isDragging }" :style="playerStyle">
      <div
        class="mini-player__inner glass glass--liquid"
        @mousedown="onPlayerDragStart"
        @mousemove="onPlayerDragMove"
        @mouseup="onPlayerDragEnd"
        @mouseleave="onPlayerDragEnd"
      >
        <div class="mini-player__drag-handle"></div>

        <div class="mini-player__meta" @dblclick="toggleMinimized">
          <div class="mini-player__title">{{ playerState.song?.name }}</div>
          <div class="mini-player__sub" v-if="!isMinimized">{{ playerState.song?.artist || playerState.playlistName }}</div>
        </div>

        <div class="mini-player__controls" v-if="!isMinimized" aria-label="播放器控制">
          <button class="mini-player__btn glass" type="button" aria-label="上一首" @click="prevTrack">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6v12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M18 7l-8 5 8 5V7z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>
          </button>
          <button class="mini-player__btn mini-player__btn--primary glass" type="button" :aria-label="playerState.isPlaying ? '暂停' : '播放'" @click="togglePlay">
            <svg v-if="!playerState.isPlaying" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 7l10 5-10 5V7z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>
            <svg v-else viewBox="0 0 24 24" aria-hidden="true"><path d="M9 7v10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M15 7v10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          </button>
          <button class="mini-player__btn glass" type="button" aria-label="下一首" @click="nextTrack">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6v12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M6 7l8 5-8 5V7z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>
          </button>
        </div>

        <button
          class="mini-player__btn mini-player__btn--primary mini-player__btn--play glass"
          type="button"
          :aria-label="playerState.isPlaying ? '暂停' : '播放'"
          @click="togglePlay"
          v-if="isMinimized"
        >
          <svg v-if="!playerState.isPlaying" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 7l10 5-10 5V7z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>
          <svg v-else viewBox="0 0 24 24" aria-hidden="true"><path d="M9 7v10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M15 7v10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </button>

        <div class="mini-player__progress" v-if="!isMinimized">
          <div class="mini-player__time">{{ formatTime(playerState.currentTime) }}</div>
          <button class="mini-player__bar" type="button" aria-label="播放进度" @click="onSeekBarClick">
            <span class="mini-player__fill" :style="{ width: `${progressPercent}%` }" />
          </button>
          <div class="mini-player__time">{{ formatTime(playerState.duration) }}</div>
        </div>

        <div class="mini-player__volume" v-if="!isMinimized">
          <svg class="mini-player__volume-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5L6 9H2v6h4l5 4V5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <input class="mini-player__volume-slider" type="range" min="0" max="100" :value="Math.round((playerState.volume || 0) * 100)" aria-label="音量" @input="onVolumeInput" />
        </div>

        <button class="mini-player__toggle" type="button" :aria-label="isMinimized ? '展开' : '收起'" @click="toggleMinimized">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" :style="{ transform: isMinimized ? 'rotate(180deg)' : 'rotate(0)' }"><path d="M6 9l6 6 6-6"/></svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.app-shell {
  min-height: var(--space-viewport-h);
}

.app-shell--has-player .app-shell__main {
  padding-bottom: var(--space-6);
}

.app-shell__nav {
  position: sticky;
  top: var(--space-0);
  z-index: var(--space-z-nav);
  padding: var(--space-layout-container-padding-y) var(--space-layout-container-padding-x);
}

.app-shell__nav-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: var(--space-layout-container-max-width);
  margin: var(--space-0) auto;
  padding: var(--space-1-5) var(--space-2);
}

.app-shell__brand {
  display: flex;
  align-items: baseline;
  gap: var(--space-1);
}

.app-shell__brand-link {
  font-family: 'Instrument Serif', serif;
  font-style: italic;
  font-weight: 300;
  font-size: 1.3rem;
  letter-spacing: 0.04em;
  color: var(--color-text-0);
  transition: opacity var(--transition-fast);
}

.app-shell__brand-link:hover {
  color: var(--color-accent);
}

.app-shell__brand-sub {
  font-size: var(--space-font-size-0);
  color: var(--color-text-2);
}

.app-shell__links {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.app-shell__link {
  padding: var(--space-0-5) var(--space-1);
  border-radius: var(--radius-round);
  font-size: var(--space-font-size-0);
  color: var(--color-text-1);
  transition: background var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast);
  border: var(--space-0-125) solid transparent;
}

.app-shell__link:hover {
  background: var(--color-glass-bg-hover);
  color: var(--color-text-0);
  border-color: var(--color-glass-border-hover);
}

.app-shell__link:active {
  background: var(--color-glass-bg-active);
}

.app-shell__link.is-active {
  color: var(--color-text-0);
  background: var(--color-glass-bg-hover);
  border-color: var(--color-glass-border-hover);
  position: relative;
}

.app-shell__link.is-active::after {
  content: '';
  position: absolute;
  top: var(--space-0-5);
  left: var(--space-0);
  bottom: var(--space-0-5);
  width: var(--space-0-375);
  background: var(--color-accent);
  border-radius: var(--radius-round);
  opacity: var(--space-opacity-0-72);
}

.app-shell__main {
  padding: var(--space-layout-container-padding-y) var(--space-layout-container-padding-x);
}

.app-shell__content {
  max-width: var(--space-layout-container-max-width);
  margin: var(--space-0) auto;
}

.route-fade-enter-active,
.route-fade-leave-active {
  transition: opacity var(--transition-base), transform var(--transition-base);
}

.route-fade-enter-from,
.route-fade-leave-to {
  opacity: var(--space-opacity-0);
  transform: translateY(var(--space-0-5));
}

.route-fade-enter-to,
.route-fade-leave-from {
  opacity: var(--space-opacity-1);
  transform: translateY(var(--space-0));
}

.mini-player {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 100;
  transition: transform 0.3s var(--transition-fast);
  max-width: 420px;
}

.mini-player--dragging {
  opacity: 0.95;
}

.mini-player__inner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 20px;
  cursor: grab;
  user-select: none;
}

.mini-player__inner:active {
  cursor: grabbing;
}

.mini-player--minimized .mini-player__inner {
  padding: 6px 10px 6px 14px;
  gap: 10px;
  border-radius: 28px;
}

.mini-player__drag-handle {
  display: none;
}

.mini-player__meta {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
  cursor: pointer;
}

.mini-player--minimized .mini-player__meta {
  flex-direction: row;
  align-items: center;
  gap: 0;
}

.mini-player__title {
  color: var(--color-text-0);
  font-size: 13px;
  font-weight: 400;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: 0.03em;
}

.mini-player--minimized .mini-player__title {
  font-size: 12px;
}

.mini-player__sub {
  color: var(--color-text-2);
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mini-player__controls {
  display: flex;
  align-items: center;
  gap: 4px;
}

.mini-player__btn {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  color: var(--color-text-1);
  transition: background var(--transition-fast), color var(--transition-fast);
  flex-shrink: 0;
}

.mini-player__btn:hover {
  background: var(--color-glass-bg-hover);
  color: var(--color-text-0);
}

.mini-player__btn--primary {
  color: var(--color-text-0);
  background: var(--color-accent-alpha);
}

.mini-player__btn--primary:hover {
  background: var(--color-accent-alpha-strong);
}

.mini-player__btn svg {
  width: 16px;
  height: 16px;
}

.mini-player__btn--play {
  flex-shrink: 0;
}

.mini-player__progress {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
}

.mini-player__time {
  color: var(--color-text-2);
  font-size: 11px;
  min-width: 36px;
  text-align: center;
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}

.mini-player__bar {
  position: relative;
  flex: 1;
  height: 20px;
  padding: 0;
  background: transparent;
  border: none;
  cursor: pointer;
}

.mini-player__bar::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 3px;
  transform: translateY(-50%);
  border-radius: 2px;
  background: var(--color-glass-bg);
}

.mini-player__bar:hover::before {
  background: var(--color-glass-bg-hover);
}

.mini-player__fill {
  position: absolute;
  top: 50%;
  left: 0;
  height: 3px;
  transform: translateY(-50%);
  border-radius: 2px;
  background: var(--color-accent-alpha);
  pointer-events: none;
}

.mini-player__volume {
  display: flex;
  align-items: center;
  gap: 6px;
}

.mini-player__volume-icon {
  width: 16px;
  height: 16px;
  color: var(--color-text-2);
  flex-shrink: 0;
}

.mini-player__volume-slider {
  width: 60px;
  accent-color: var(--color-accent);
  opacity: 0.6;
  cursor: pointer;
}

.mini-player__toggle {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  color: var(--color-text-2);
  opacity: 0.4;
  flex-shrink: 0;
  transition: opacity var(--transition-fast);
}

.mini-player__toggle:hover {
  opacity: 0.8;
}

.mini-player__toggle svg {
  transition: transform 0.3s var(--transition-fast);
}

.mini-player__volume-icon {
  width: var(--space-2-25);
  height: var(--space-2-25);
  color: var(--color-text-2);
}

.mini-player__volume-slider {
  width: var(--space-5);
}

@media (max-width: 860px) {
  .mini-player__inner {
    grid-template-columns: 1fr auto auto;
    grid-template-areas:
      'meta controls volume'
      'progress progress progress';
    padding: var(--space-1-5);
  }

  .mini-player__meta {
    grid-area: meta;
  }

  .mini-player__controls {
    grid-area: controls;
  }

  .mini-player__progress {
    grid-area: progress;
  }

  .mini-player__volume {
    grid-area: volume;
    justify-content: flex-end;
  }
}
</style>
