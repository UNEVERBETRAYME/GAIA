import { playlistsData, allSongs, getMoodLabel, findSongByKey } from '../music-data.js'
import { audio, getState, subscribe, playSong, togglePlay, seekTo, formatTime, prevTrack, nextTrack, toggleShuffle } from '../music-player.js'
import { loadAudioManifest, buildLibrarySongs, groupByPlaylist, loadSongMetadata } from '../audio-library.js'

let unsubscribe = null
let librarySongs = []
let currentLibraryMood = 'all'

const ICONS = {
  play: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 7l10 5-10 5V7z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`,
  pause: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 7v10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M15 7v10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
  repeat: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h10a3 3 0 0 1 3 3v2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M17 17H7a3 3 0 0 1-3-3v-2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M17 5l2 2-2 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 19l-2-2 2-2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  repeatOne: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h10a3 3 0 0 1 3 3v2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M17 17H7a3 3 0 0 1-3-3v-2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M17 5l2 2-2 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 19l-2-2 2-2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12.5 9.5h-1.5l-1 1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M11 10.5v4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
}

const REPEAT_MODE = {
  off: 'off',
  all: 'all',
  one: 'one',
}

let repeatMode = REPEAT_MODE.off

function renderPlaylists() {
  const grid = document.getElementById('playlistsGrid')
  if (!grid) return
  grid.innerHTML = ''

  playlistsData.forEach((pl, plIdx) => {
    const card = document.createElement('div')
    card.className = 'glass-card music-playlist-card'
    card.dataset.playlist = plIdx

    const songsHtml = pl.songs.map((song, songIdx) => {
      const key = `${plIdx}-${songIdx}`
      song._key = key
      return `<div class="music-song" data-key="${key}"><span class="music-song__name">${song.name}</span><span class="music-song__duration">--:--</span></div>`
    }).join('')

    card.innerHTML = `
      <div class="music-playlist-card__cover" style="background: ${pl.gradient}"></div>
      <div class="music-playlist-card__info">
        <h3 class="music-playlist-card__name">${pl.name}</h3>
        <span class="glass-tag music-playlist-card__count">${pl.songs.length} 首</span>
      </div>
      <p class="music-playlist-card__desc">${pl.desc}</p>
      <div class="music-playlist-card__songs">${songsHtml}</div>
    `

    grid.appendChild(card)
  })

  grid.addEventListener('click', (e) => {
    const songEl = e.target.closest('.music-song')
    if (songEl) {
      e.stopPropagation()
      const key = songEl.dataset.key
      const result = findSongByKey(key)
      if (result) playSong(result.song, result.playlistName)
      return
    }

    const card = e.target.closest('.music-playlist-card')
    if (card) {
      const isExpanded = card.classList.contains('expanded')
      grid.querySelectorAll('.music-playlist-card').forEach((c) => c.classList.remove('expanded'))
      if (!isExpanded) card.classList.add('expanded')
    }
  })
}

function applyCover(artEl, state) {
  if (!artEl || !state.song) return

  if (state.coverUrl) {
    artEl.style.backgroundImage = `url(${state.coverUrl})`
    artEl.style.backgroundSize = 'cover'
    artEl.style.backgroundPosition = 'center'
    artEl.style.backgroundRepeat = 'no-repeat'
    artEl.style.backgroundColor = 'transparent'
  } else {
    artEl.style.backgroundImage = ''
    artEl.style.background = state.song.gradient
  }
}

function setButtonIcon(btn, iconMarkup) {
  if (!btn) return
  if (btn.innerHTML !== iconMarkup) {
    btn.innerHTML = iconMarkup
  }
}

function syncControlButtons(state) {
  const playBtn = document.getElementById('playBtn')
  const shuffleBtn = document.getElementById('shuffleBtn')
  const repeatBtn = document.getElementById('repeatBtn')

  if (playBtn) {
    setButtonIcon(playBtn, state.isPlaying ? ICONS.pause : ICONS.play)
    playBtn.setAttribute('aria-label', state.isPlaying ? '暂停' : '播放')
  }

  if (shuffleBtn) {
    shuffleBtn.classList.toggle('player-btn--active', !!state.shuffleEnabled)
  }

  if (repeatBtn) {
    repeatBtn.classList.toggle('player-btn--active', repeatMode !== REPEAT_MODE.off)
    setButtonIcon(repeatBtn, repeatMode === REPEAT_MODE.one ? ICONS.repeatOne : ICONS.repeat)
    if (repeatMode === REPEAT_MODE.one) {
      repeatBtn.setAttribute('aria-label', '单曲循环')
    } else if (repeatMode === REPEAT_MODE.all) {
      repeatBtn.setAttribute('aria-label', '列表循环')
    } else {
      repeatBtn.setAttribute('aria-label', '循环播放')
    }
  }
}

function applyRepeatMode() {
  audio.loop = repeatMode === REPEAT_MODE.one
  syncControlButtons(getState())
}

function cycleRepeatMode() {
  if (repeatMode === REPEAT_MODE.off) {
    repeatMode = REPEAT_MODE.all
  } else if (repeatMode === REPEAT_MODE.all) {
    repeatMode = REPEAT_MODE.one
  } else {
    repeatMode = REPEAT_MODE.off
  }

  applyRepeatMode()
}

function syncPlayerUI(state) {
  syncControlButtons(state)

  if (!state.song) {
    document.getElementById('currentTime').textContent = '0:00'
    document.getElementById('totalTime').textContent = '0:00'
    document.getElementById('progressFill').style.width = '0%'
    return
  }

  applyCover(document.getElementById('playerArt'), state)
  document.getElementById('playerTitle').textContent = state.song.name
  document.getElementById('playerArtist').textContent = state.playlistName || state.song.artist
  document.getElementById('playerMood').textContent = getMoodLabel(state.song.mood)

  if (state.duration > 0) {
    document.getElementById('totalTime').textContent = formatTime(state.duration)
  }

  document.getElementById('currentTime').textContent = formatTime(state.currentTime)
  const percent = state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0
  document.getElementById('progressFill').style.width = `${percent}%`

  document.querySelectorAll('.music-song').forEach((el) => el.classList.remove('active'))

  const idx = allSongs.findIndex((s) => s.src === state.song.src)
  if (idx !== -1) {
    const activeSong = allSongs[idx]
    if (activeSong._key) {
      const songEl = document.querySelector(`.music-song[data-key="${activeSong._key}"]`)
      if (songEl) songEl.classList.add('active')
    }
  }
}

function initPlayerControls() {
  const playBtn = document.getElementById('playBtn')
  const prevBtn = document.getElementById('prevBtn')
  const nextBtn = document.getElementById('nextBtn')
  const shuffleBtn = document.getElementById('shuffleBtn')
  const repeatBtn = document.getElementById('repeatBtn')

  playBtn.addEventListener('click', () => {
    togglePlay()
  })

  prevBtn.addEventListener('click', () => {
    prevTrack()
  })

  nextBtn.addEventListener('click', () => {
    nextTrack()
  })

  shuffleBtn.addEventListener('click', () => {
    toggleShuffle()
  })

  repeatBtn.addEventListener('click', () => {
    cycleRepeatMode()
  })

  const progressBar = document.querySelector('.music-player__progress-bar')
  progressBar.addEventListener('click', (e) => {
    const state = getState()
    if (!state.song || !state.duration) return
    const rect = progressBar.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    seekTo(percent)
  })
}

function initMoodTags() {
  const tags = document.querySelectorAll('.music-mood-tag')
  const grid = document.getElementById('moodsGrid')

  function renderMoodCards(mood) {
    const filtered = mood === 'all' ? allSongs : allSongs.filter((s) => s.mood === mood)
    grid.innerHTML = ''

    filtered.forEach((song) => {
      const card = document.createElement('div')
      card.className = 'glass-card music-mood-card'
      card.innerHTML = `
        <div class="music-mood-card__art" style="background: ${song.gradient}"></div>
        <div class="music-mood-card__info">
          <div class="music-mood-card__name">${song.name}</div>
          <div class="music-mood-card__artist">${song.playlistName}</div>
        </div>
        <span class="glass-tag music-mood-card__mood-tag">${getMoodLabel(song.mood)}</span>
      `

      card.addEventListener('click', () => {
        playSong(song, song.playlistName)
      })

      grid.appendChild(card)
    })
  }

  tags.forEach((tag) => {
    tag.addEventListener('click', () => {
      tags.forEach((t) => t.classList.remove('active'))
      tag.classList.add('active')
      renderMoodCards(tag.dataset.mood)
    })
  })

  renderMoodCards('all')
}

// ============================================================
// 本地音乐库功能
// ============================================================

async function initLibrary() {
  try {
    const files = await loadAudioManifest()
    if (files.length === 0) {
      console.log('本地音乐库为空')
      return
    }

    librarySongs = buildLibrarySongs(files)

    // 显示音乐库区块
    const librarySection = document.getElementById('librarySection')
    if (librarySection) {
      librarySection.style.display = 'block'
    }

    // 初始化过滤标签
    initLibraryMoodTags()

    // 渲染音乐库
    renderLibrary(currentLibraryMood)
  } catch (error) {
    console.error('加载本地音乐库失败:', error)
  }
}

function initLibraryMoodTags() {
  const tags = document.querySelectorAll('.music-library-mood-tag')

  tags.forEach(tag => {
    tag.addEventListener('click', () => {
      tags.forEach(t => t.classList.remove('active'))
      tag.classList.add('active')
      currentLibraryMood = tag.dataset.mood
      renderLibrary(currentLibraryMood)
    })
  })
}

function renderLibrary(mood) {
  const content = document.getElementById('libraryContent')
  if (!content) return

  // 过滤歌曲
  const filtered = mood === 'all'
    ? librarySongs
    : librarySongs.filter(s => s.mood === mood)

  if (filtered.length === 0) {
    content.innerHTML = '<div class="music-library__empty">暂无符合条件的歌曲</div>'
    return
  }

  // 按歌单分组
  const grouped = groupByPlaylist(filtered)

  content.innerHTML = ''

  Object.entries(grouped).forEach(([playlistName, songs]) => {
    const group = document.createElement('div')
    group.className = 'music-library__group'

    const title = document.createElement('h3')
    title.className = 'music-library__group-title'
    title.textContent = `${playlistName} (${songs.length})`

    const songsList = document.createElement('div')
    songsList.className = 'music-library__songs-list'

    songs.forEach(song => {
      const songEl = createLibrarySongElement(song)
      songsList.appendChild(songEl)
    })

    group.appendChild(title)
    group.appendChild(songsList)
    content.appendChild(group)
  })
}

function createLibrarySongElement(song) {
  const el = document.createElement('div')
  el.className = 'music-library-song'

  const coverStyle = song.coverUrl
    ? `background-image: url(${song.coverUrl}); background-size: cover; background-position: center;`
    : `background: ${song.gradient};`

  const moodLabel = song.moodLabel || '未知'

  el.innerHTML = `
    <div class="music-library-song__cover" style="${coverStyle}"></div>
    <div class="music-library-song__info">
      <div class="music-library-song__name">${song.name}</div>
      <div class="music-library-song__artist">${song.artist}</div>
    </div>
    <div class="music-library-song__meta">
      <span class="music-library-song__mood">${moodLabel}</span>
    </div>
  `

  el.addEventListener('click', async () => {
    // 懒加载 ID3 元数据
    await loadSongMetadata(song)

    // 播放歌曲
    playSong(song, song.playlistName)

    // 更新封面（如果加载到了）
    if (song.coverUrl) {
      const coverEl = el.querySelector('.music-library-song__cover')
      if (coverEl) {
        coverEl.style.backgroundImage = `url(${song.coverUrl})`
        coverEl.style.backgroundSize = 'cover'
        coverEl.style.backgroundPosition = 'center'
      }
    }
  })

  return el
}

export function initMusicPage() {
  repeatMode = REPEAT_MODE.off
  applyRepeatMode()

  renderPlaylists()
  initPlayerControls()
  initMoodTags()

  // 初始化本地音乐库
  initLibrary()

  const state = getState()
  syncPlayerUI(state)

  unsubscribe = subscribe((nextState) => {
    syncPlayerUI(nextState)
  })
}

export function teardownMusicPage() {
  audio.loop = false
  repeatMode = REPEAT_MODE.off

  if (unsubscribe) {
    unsubscribe()
    unsubscribe = null
  }
}
