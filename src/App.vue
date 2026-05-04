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

      <div v-if="hasMiniPlayer" class="mini-player">
      <div class="mini-player__inner glass glass--surface">
        <div class="mini-player__meta">
          <div class="mini-player__title">{{ playerState.song?.name }}</div>
          <div class="mini-player__sub">{{ playerState.song?.artist || playerState.playlistName }}</div>
        </div>

        <div class="mini-player__controls" aria-label="播放器控制">
          <button class="mini-player__btn glass" type="button" aria-label="上一首" @click="prevTrack">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6v12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              <path d="M18 7l-8 5 8 5V7z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
            </svg>
          </button>
          <button
            class="mini-player__btn mini-player__btn--primary glass"
            type="button"
            :aria-label="playerState.isPlaying ? '暂停' : '播放'"
            @click="togglePlay"
          >
            <svg v-if="!playerState.isPlaying" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 7l10 5-10 5V7z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
            </svg>
            <svg v-else viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 7v10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              <path d="M15 7v10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
          </button>
          <button class="mini-player__btn glass" type="button" aria-label="下一首" @click="nextTrack">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M18 6v12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              <path d="M6 7l8 5-8 5V7z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
            </svg>
          </button>
        </div>

        <div class="mini-player__progress">
          <div class="mini-player__time">{{ formatTime(playerState.currentTime) }}</div>
          <button class="mini-player__bar" type="button" aria-label="播放进度" @click="onSeekBarClick">
            <span class="mini-player__fill" :style="{ width: `${progressPercent}%` }" />
          </button>
          <div class="mini-player__time">{{ formatTime(playerState.duration) }}</div>
        </div>

        <div class="mini-player__volume">
          <svg class="mini-player__volume-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M11 5L6 9H2v6h4l5 4V5z"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M15.54 8.46a5 5 0 0 1 0 7.07"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <input
            class="mini-player__volume-slider"
            type="range"
            min="0"
            max="100"
            :value="Math.round((playerState.volume || 0) * 100)"
            aria-label="音量"
            @input="onVolumeInput"
          />
        </div>
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
  position: sticky;
  bottom: var(--space-0);
  z-index: var(--space-z-nav);
  padding: var(--space-2) var(--space-layout-container-padding-x);
  padding-bottom: calc(var(--space-2) + env(safe-area-inset-bottom));
}

.mini-player__inner {
  max-width: var(--space-layout-reading-max-width);
  margin: var(--space-0) auto;
  display: grid;
  grid-template-columns: minmax(var(--space-0), 1.4fr) auto minmax(var(--space-0), 1fr) auto;
  gap: var(--space-2);
  align-items: center;
  padding: var(--space-1-5) var(--space-2);
  background: var(--color-bg-1);
  border: var(--space-0-125) solid var(--color-glass-border);
  border-radius: var(--radius-2-5);
  backdrop-filter: blur(var(--space-glass-blur)) saturate(var(--space-glass-saturate));
}

.mini-player__meta {
  min-width: var(--space-0);
  display: flex;
  flex-direction: column;
  gap: var(--space-0-25);
}

.mini-player__title {
  color: var(--color-text-0);
  font-size: var(--space-font-size-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mini-player__sub {
  color: var(--color-text-2);
  font-size: var(--space-font-size-0);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mini-player__controls {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.mini-player__btn {
  width: var(--space-4);
  height: var(--space-4);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-round);
  color: var(--color-text-0);
  transition: background var(--transition-fast), border-color var(--transition-fast);
}

.mini-player__btn:hover {
  background: var(--color-glass-bg-hover);
  border-color: var(--color-glass-border-hover);
}

.mini-player__btn--primary {
  background: var(--color-accent-alpha);
  border-color: var(--color-glass-border-hover);
}

.mini-player__btn--primary:hover {
  background: var(--color-accent-alpha-strong);
  border-color: var(--color-glass-border-hover);
}

.mini-player__btn--primary:active {
  background: var(--color-glass-bg-active);
}

.mini-player__btn svg {
  width: var(--space-2-25);
  height: var(--space-2-25);
}

.mini-player__progress {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  min-width: var(--space-0);
}

.mini-player__time {
  color: var(--color-text-2);
  font-size: var(--space-font-size-0);
  min-width: var(--space-4);
  text-align: center;
}

.mini-player__bar {
  position: relative;
  flex: 1;
  border-radius: var(--radius-round);
  padding: var(--space-1) var(--space-0);
  background: transparent;
  border: var(--space-0-125) solid transparent;
  transition: border-color var(--transition-fast), background var(--transition-fast);
}

.mini-player__bar::before {
  content: '';
  position: absolute;
  left: var(--space-0);
  right: var(--space-0);
  top: 50%;
  height: var(--space-0-5);
  transform: translateY(-50%);
  border-radius: var(--radius-round);
  background: var(--color-glass-bg);
  border: var(--space-0-125) solid var(--color-glass-border);
  transition: border-color var(--transition-fast), background var(--transition-fast);
}

.mini-player__bar:hover::before {
  background: var(--color-glass-bg-hover);
  border-color: var(--color-glass-border-hover);
}

.mini-player__fill {
  position: absolute;
  top: 50%;
  left: var(--space-0);
  height: var(--space-0-5);
  transform: translateY(-50%);
  border-radius: var(--radius-round);
  background: var(--color-accent-alpha);
}

.mini-player__volume {
  display: flex;
  align-items: center;
  gap: var(--space-1);
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
