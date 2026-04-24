<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { EMOTIONS, buildQueryWithMood, buildUrlWithMood, getEmotionDesc, getEmotionLabel, normalizeEmotionKey, readEmotionFromQuery } from '../../js/emotions.js'
import { playlistsData } from '../../js/music-data.js'
import { formatTime, getState, playSong, subscribe, togglePlay } from '../../js/music-player.js'

const route = useRoute()
const router = useRouter()

const currentMood = ref(null)
const expandedPlaylist = ref(null)

const playerState = ref(getState())
let unsubscribePlayer = null

const moodLabel = computed(() => (currentMood.value ? getEmotionLabel(currentMood.value) : '全部'))
const moodDesc = computed(() => (currentMood.value ? getEmotionDesc(currentMood.value) : '从情绪进入，让旋律先替你开口。'))

const filteredPlaylists = computed(() => {
  const k = currentMood.value
  if (!k) return playlistsData
  return playlistsData
    .map((pl) => ({
      ...pl,
      songs: pl.songs.filter((s) => normalizeEmotionKey(s.mood) === k),
    }))
    .filter((pl) => pl.songs.length > 0)
})

const nowPlayingMoodLabel = computed(() => getEmotionLabel(playerState.value.song?.mood))
const coverStyle = computed(() => {
  const url = playerState.value.coverUrl
  if (!url) return {}
  return {
    backgroundImage: `url('${url}')`,
  }
})

function setMood(nextMood) {
  router.replace({ query: buildQueryWithMood(route.query, nextMood) })
}

function syncMoodFromRoute() {
  currentMood.value = readEmotionFromQuery(route.query)
}

function togglePlaylist(name) {
  expandedPlaylist.value = expandedPlaylist.value === name ? null : name
}

function isActiveSong(song) {
  const cur = playerState.value.song
  if (!cur || !song) return false
  return cur.src === song.src
}

function playFromList(song, playlistName) {
  playSong(song, playlistName)
}

onMounted(() => {
  syncMoodFromRoute()
  playerState.value = getState()
  unsubscribePlayer = subscribe((s) => {
    playerState.value = s
  })
})

onBeforeUnmount(() => {
  if (typeof unsubscribePlayer === 'function') unsubscribePlayer()
  unsubscribePlayer = null
})

watch(
  () => route.query.mood,
  () => syncMoodFromRoute()
)
</script>

<template>
  <div class="music">
    <section class="music__hero">
      <h1 class="music__title">情绪音乐</h1>
      <p class="music__subtitle">深夜的旋律，是情绪最柔软的容器。</p>
    </section>

    <section class="music__panel glass glass--surface">
      <div class="music__panel-head">
        <div class="music__panel-title">当前情绪</div>
        <div class="music__panel-meta">{{ moodLabel }}</div>
      </div>
      <div class="music__panel-desc">{{ moodDesc }}</div>

      <div class="music__moods" role="group" aria-label="情绪筛选">
        <button class="music__mood glass glass--interactive" type="button" :class="{ 'is-active': !currentMood }" @click="setMood(null)">
          全部
        </button>
        <button
          v-for="m in EMOTIONS"
          :key="m.key"
          class="music__mood glass glass--interactive"
          type="button"
          :class="{ 'is-active': currentMood === m.key }"
          @click="setMood(m.key)"
        >
          {{ m.label }}
        </button>
      </div>

      <div class="music__bridge">
        <RouterLink class="music__bridge-link glass glass--interactive" :to="buildUrlWithMood('/translate', currentMood)">去翻译</RouterLink>
        <RouterLink class="music__bridge-link glass glass--interactive" :to="buildUrlWithMood('/words', currentMood)">去读同情绪</RouterLink>
        <RouterLink class="music__bridge-link glass glass--interactive" :to="buildUrlWithMood('/ai', currentMood)">去生成提示词</RouterLink>
      </div>
    </section>

    <section class="music__now glass glass--surface">
      <div class="music__now-art" :class="`music__now-art--${playerState.song?.mood || 'none'}`" :style="coverStyle" />
      <div class="music__now-main">
        <div class="music__now-title">{{ playerState.song?.name || '未选择歌曲' }}</div>
        <div class="music__now-sub">{{ playerState.song?.artist || '从下面挑一首开始播放' }}</div>
        <div v-if="playerState.song" class="music__now-meta">
          <span class="music__now-mood glass">{{ nowPlayingMoodLabel }}</span>
          <span class="music__now-time">{{ formatTime(playerState.currentTime) }} / {{ formatTime(playerState.duration) }}</span>
        </div>
      </div>
      <button class="music__now-btn glass glass--interactive" type="button" :disabled="!playerState.song" @click="togglePlay">
        {{ playerState.isPlaying ? '暂停' : '播放' }}
      </button>
    </section>

    <section class="music__section">
      <h2 class="music__section-title">播放列表</h2>

      <div v-if="filteredPlaylists.length === 0" class="music__empty glass glass--surface">
        这一种情绪下暂时没有歌单。你可以换一种情绪，或回到“全部”。
      </div>

      <div v-else class="music__lists">
        <article
          v-for="pl in filteredPlaylists"
          :key="pl.name"
          class="music__list glass glass--surface"
          :class="{ 'is-expanded': expandedPlaylist === pl.name }"
        >
          <button class="music__list-head" type="button" @click="togglePlaylist(pl.name)">
            <div class="music__list-text">
              <div class="music__list-title">{{ pl.name }}</div>
              <div class="music__list-desc">{{ pl.desc }}</div>
            </div>
            <span class="music__list-count glass">{{ pl.songs.length }} 首</span>
          </button>

          <div class="music__tracks">
            <button
              v-for="song in pl.songs"
              :key="song.src"
              class="music__track"
              type="button"
              :class="{ 'is-active': isActiveSong(song) }"
              @click="playFromList(song, pl.name)"
            >
              <span class="music__track-name">{{ song.name }}</span>
              <span class="music__track-artist">{{ song.artist }}</span>
            </button>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.music {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding-bottom: var(--space-6);
}

.music__hero {
  padding: var(--space-4) var(--space-0);
}

.music__title {
  font-size: var(--space-font-size-5);
  color: var(--color-text-0);
  margin: var(--space-0);
}

.music__subtitle {
  margin: var(--space-1) var(--space-0) var(--space-0);
  max-width: var(--space-layout-subtitle-max-width);
  color: var(--color-text-1);
}

.music__panel {
  padding: var(--space-4);
}

.music__panel-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-2);
}

.music__panel-title {
  font-size: var(--space-font-size-2);
  color: var(--color-text-0);
}

.music__panel-meta {
  font-size: var(--space-font-size-0);
  color: var(--color-accent);
}

.music__panel-desc {
  margin-top: var(--space-1);
  color: var(--color-text-1);
}

.music__moods {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  margin-top: var(--space-2);
}

.music__mood {
  padding: var(--space-0-5) var(--space-1-5);
  border-radius: var(--radius-round);
  font-size: var(--space-font-size-0);
  color: var(--color-text-1);
  transition: background var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast);
}

.music__mood:hover {
  background: var(--color-glass-bg-hover);
  border-color: var(--color-glass-border-hover);
  color: var(--color-text-0);
}

.music__mood.is-active {
  color: var(--color-text-0);
  border-color: var(--color-glass-border-hover);
  background: var(--color-accent-alpha);
}

.music__bridge {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  margin-top: var(--space-3);
}

.music__bridge-link {
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-round);
  font-size: var(--space-font-size-0);
  color: var(--color-text-0);
  transition: background var(--transition-fast), border-color var(--transition-fast);
  border: var(--space-0-125) solid var(--color-glass-border);
  background: var(--color-glass-bg);
}

.music__bridge-link:hover {
  background: var(--color-glass-bg-hover);
  border-color: var(--color-glass-border-hover);
}

.music__now {
  padding: var(--space-3);
  display: grid;
  grid-template-columns: var(--space-6) 1fr auto;
  gap: var(--space-2);
  align-items: start;
  max-width: var(--space-layout-reading-max-width);
  margin-left: auto;
  margin-right: auto;
}

.music__now-art {
  position: relative;
  overflow: hidden;
  width: var(--space-6);
  height: var(--space-6);
  border-radius: var(--radius-2);
  background: linear-gradient(135deg, var(--color-bg-2), var(--color-bg-1));
  border: var(--space-0-125) solid var(--color-glass-border);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.music__now-art::after {
  content: '';
  position: absolute;
  inset: var(--space-0);
  background: linear-gradient(180deg, var(--color-glass-highlight-soft), var(--color-glass-highlight-none));
  opacity: var(--space-opacity-0-72);
  pointer-events: none;
}

.music__now-art--lonely {
  background: linear-gradient(135deg, var(--color-bg-1), var(--color-accent-alpha));
}

.music__now-art--melancholy {
  background: linear-gradient(135deg, var(--color-bg-2), var(--color-bg-1));
}

.music__now-art--calm {
  background: linear-gradient(135deg, var(--color-glass-bg), var(--color-bg-1));
}

.music__now-art--healing {
  background: linear-gradient(135deg, var(--color-bg-2), var(--color-glass-bg-hover));
}

.music__now-title {
  color: var(--color-text-0);
  font-size: var(--space-font-size-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.music__now-sub {
  margin-top: var(--space-0-5);
  color: var(--color-text-2);
  font-size: var(--space-font-size-0);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.music__now-meta {
  margin-top: var(--space-1);
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.music__now-mood {
  padding: var(--space-0-25) var(--space-1);
  border-radius: var(--radius-round);
  font-size: var(--space-font-size-0);
  color: var(--color-text-1);
}

.music__now-time {
  color: var(--color-text-2);
  font-size: var(--space-font-size-0);
}

.music__now-btn {
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-round);
  color: var(--color-text-0);
  transition: background var(--transition-fast), border-color var(--transition-fast), opacity var(--transition-fast);
  align-self: center;
}

.music__now-btn:hover {
  background: var(--color-glass-bg-hover);
  border-color: var(--color-glass-border-hover);
}

.music__now-btn:disabled {
  opacity: 0.6;
}

.music__section-title {
  font-size: var(--space-font-size-3);
  color: var(--color-text-0);
  margin: var(--space-0);
}

.music__empty {
  margin-top: var(--space-2);
  padding: var(--space-3);
  color: var(--color-text-1);
}

.music__lists {
  margin-top: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  max-width: var(--space-layout-reading-max-width);
  margin-left: auto;
  margin-right: auto;
}

.music__list {
  padding: var(--space-0);
  overflow: hidden;
}

.music__list-head {
  width: var(--space-100p);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-2);
  padding: var(--space-3);
  text-align: left;
  border-radius: var(--radius-2);
  border: var(--space-0-125) solid transparent;
  transition: background var(--transition-fast), border-color var(--transition-fast);
}

.music__list-head:hover {
  background: var(--color-glass-bg);
  border-color: var(--color-glass-border);
}

.music__list-head:active {
  background: var(--color-glass-bg-hover);
}

.music__list-title {
  color: var(--color-text-0);
  font-size: var(--space-font-size-3);
}

.music__list-desc {
  margin-top: var(--space-1);
  color: var(--color-text-1);
}

.music__list-count {
  padding: var(--space-0-25) var(--space-1);
  border-radius: var(--radius-round);
  font-size: var(--space-font-size-0);
  color: var(--color-text-1);
  flex-shrink: 0;
}

.music__tracks {
  padding: var(--space-0) var(--space-3) var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-0-5);
  max-height: var(--space-6);
  overflow: hidden;
  transition: max-height var(--transition-base);
}

.music__list.is-expanded .music__tracks {
  max-height: calc(var(--space-6) * 10);
}

.music__track {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-1-5);
  border-radius: var(--radius-2);
  border: var(--space-0-125) solid var(--color-glass-border);
  color: var(--color-text-0);
  transition: background var(--transition-fast), border-color var(--transition-fast);
  min-width: var(--space-0);
  line-height: var(--space-font-line-height-tight);
  background: transparent;
}

.music__track:hover {
  background: var(--color-glass-bg);
  border-color: var(--color-glass-border);
}

.music__track:active {
  background: var(--color-glass-bg-active);
}

.music__track.is-active {
  background: var(--color-accent-alpha);
  border-color: var(--color-glass-border-hover);
}

.music__track-name {
  text-align: left;
  min-width: var(--space-0);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.music__track-artist {
  text-align: right;
  color: var(--color-text-2);
  font-size: var(--space-font-size-0);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 860px) {
  .music__panel {
    padding: var(--space-3);
  }

  .music__lists {
    margin-left: var(--space-0);
    margin-right: var(--space-0);
  }

  .music__now {
    grid-template-columns: var(--space-5) 1fr;
    grid-template-areas:
      'art main'
      'btn btn';
    margin-left: var(--space-0);
    margin-right: var(--space-0);
  }

  .music__now-art {
    width: var(--space-5);
    height: var(--space-5);
    grid-area: art;
  }

  .music__now-main {
    grid-area: main;
  }

  .music__now-btn {
    grid-area: btn;
    width: var(--space-100p);
    margin-top: var(--space-1);
  }

  .music__now-title,
  .music__now-sub {
    white-space: normal;
  }
}
</style>
