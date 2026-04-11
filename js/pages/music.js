import { playlistsData, allSongs, getMoodLabel, findSongByKey } from '../music-data.js'
import { audio, getState, subscribe, playSong, togglePlay, seekTo, formatTime, prevTrack, nextTrack, toggleShuffle, setVolume } from '../music-player.js'
import { loadAudioManifest, buildLibrarySongs, groupByPlaylist, loadSongMetadata } from '../audio-library.js'

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

const LIBRARY_PLAYLIST_DESCRIPTIONS = {
  '温柔治愈': '把刺放下，让心在柔光里慢慢复原',
  '孤独之海': '潮声替你说话，孤独也有它的温度',
  '深夜独白': '灯灭之后，剩下的句子都写给自己听',
  '平静片刻': '暂停一下，把呼吸放回当下的节奏',
}

let repeatMode = REPEAT_MODE.off

async function renderPlaylists() {
  const grid = document.getElementById('playlistsGrid')
  if (!grid) return
  grid.innerHTML = ''

  // 1. 渲染精选歌单
  playlistsData.forEach((pl, plIdx) => {
    const card = document.createElement('div')
    card.className = 'glass-card music-playlist-card'
    card.dataset.playlist = plIdx
    const shouldScroll = pl.songs.length > 5

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
      <div class="music-playlist-card__songs ${shouldScroll ? 'music-playlist-card__songs--scrollable' : ''}"><div class="music-playlist-card__songs-list">${songsHtml}</div></div>
    `

    const coverEl = card.querySelector('.music-playlist-card__cover')
    const coverSource = pl.songs.find((song) => !!song.audio)
    if (coverEl && coverSource) {
      loadSongMetadata(coverSource).then((meta) => {
        if (meta?.coverUrl) {
          coverEl.style.background = `center / cover no-repeat url('${meta.coverUrl}')`
        }
      }).catch(() => {})
    }

    grid.appendChild(card)
  })

  // 2. 加载并渲染本地音乐库歌单
  try {
    const files = await loadAudioManifest()
    if (files.length > 0) {
      librarySongs = buildLibrarySongs(files)
      const grouped = groupByPlaylist(librarySongs)

      Object.entries(grouped).forEach(([playlistName, songs]) => {
        const card = document.createElement('div')
        card.className = 'glass-card music-playlist-card music-playlist-card--library'
        card.dataset.playlistLibrary = playlistName
        const shouldScroll = songs.length > 5

        const songsHtml = songs.map((song, idx) => {
          const key = `library-${playlistName}-${idx}`
          song._key = key
          return `<div class="music-song music-song--library" data-library-key="${key}"><span class="music-song__name">${song.name}</span><span class="music-song__artist-inline">${song.artist}</span></div>`
        }).join('')

        // 使用第一首歌的渐变色作为封面
        const gradient = songs[0]?.gradient || 'linear-gradient(135deg, #1a2535, #0d1520)'

        card.innerHTML = `
          <div class="music-playlist-card__cover" style="background: ${gradient}"></div>
          <div class="music-playlist-card__info">
            <h3 class="music-playlist-card__name">${playlistName}</h3>
            <span class="glass-tag music-playlist-card__count">${songs.length} 首</span>
          </div>
          <p class="music-playlist-card__desc">${LIBRARY_PLAYLIST_DESCRIPTIONS[playlistName] || '本地收藏的声音片段。'}</p>
          <div class="music-playlist-card__songs ${shouldScroll ? 'music-playlist-card__songs--scrollable' : ''}"><div class="music-playlist-card__songs-list">${songsHtml}</div></div>
        `

        const coverEl = card.querySelector('.music-playlist-card__cover')
        const coverSource = songs[0]
        if (coverEl && coverSource) {
          loadSongMetadata(coverSource).then((meta) => {
            if (meta?.coverUrl) {
              coverEl.style.background = `center / cover no-repeat url('${meta.coverUrl}')`
            }
          }).catch(() => {})
        }

        grid.appendChild(card)
      })
    }
  } catch (error) {
    console.error('加载本地音乐库失败:', error)
  }

  // 3. 绑定点击事件
  grid.addEventListener('click', (e) => {
    // 处理本地库歌曲点击
    const librarySongEl = e.target.closest('.music-song--library')
    if (librarySongEl) {
      e.stopPropagation()
      const key = librarySongEl.dataset.libraryKey
      const [, playlistName, idx] = key.split('-')
      const grouped = groupByPlaylist(librarySongs)
      const song = grouped[playlistName]?.[parseInt(idx)]
      if (song) {
        loadSongMetadata(song).then(() => {
          playSong(song, song.playlistName)
          // 播放后自动折叠所有歌单
          grid.querySelectorAll('.music-playlist-card').forEach((c) => c.classList.remove('expanded'))
        })
      }
      return
    }

    // 处理精选歌单歌曲点击
    const songEl = e.target.closest('.music-song')
    if (songEl) {
      e.stopPropagation()
      const key = songEl.dataset.key
      const result = findSongByKey(key)
      if (result) {
        playSong(result.song, result.playlistName)
        // 播放后自动折叠所有歌单
        grid.querySelectorAll('.music-playlist-card').forEach((c) => c.classList.remove('expanded'))
      }
      return
    }

    // 处理卡片展开/收起
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
  const playerEl = document.querySelector('.music-player')
  if (playerEl) {
    playerEl.style.setProperty('--music-player-ambient', state.song.gradient)
    playerEl.classList.remove('music-player--refresh')
    requestAnimationFrame(() => {
      playerEl.classList.add('music-player--refresh')
      window.setTimeout(() => {
        playerEl.classList.remove('music-player--refresh')
      }, 700)
    })
  }

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

  const volumeSlider = document.getElementById('volumeSlider')
  if (volumeSlider) {
    volumeSlider.value = Math.round(state.volume * 100)
  }

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
  const volumeSlider = document.getElementById('volumeSlider')

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

  if (volumeSlider) {
    volumeSlider.addEventListener('input', (e) => {
      const value = parseInt(e.target.value, 10) / 100
      setVolume(value)
    })
  }

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
    const filtered = allSongs.filter((s) => s.mood === mood)
    grid.innerHTML = ''

    filtered.forEach((song) => {
      const card = document.createElement('div')
      card.className = 'glass-card music-mood-card'
      card.innerHTML = `
        <div class="music-mood-card__art" style="background: ${song.gradient}"></div>
        <div class="music-mood-card__info">
          <div class="music-mood-card__eyebrow">${song.playlistName}</div>
          <div class="music-mood-card__name">${song.name}</div>
          <div class="music-mood-card__artist">${song.artist}</div>
        </div>
        <div class="music-mood-card__actions">
          <span class="glass-tag music-mood-card__mood-tag">${getMoodLabel(song.mood)}</span>
          <span class="music-mood-card__play">播放</span>
        </div>
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

  // 默认显示第一个心情（忧郁）
  renderMoodCards('melancholy')
}

// ============================================================
// 本地音乐库功能（已整合到精选歌单，此处保留空函数）
// ============================================================

async function initLibrary() {
  // 本地音乐库已整合到 renderPlaylists() 中
  // 此函数保留为空，避免破坏现有调用
}

export async function initMusicPage() {
  repeatMode = REPEAT_MODE.off
  applyRepeatMode()

  await renderPlaylists()
  initPlayerControls()
  initMoodTags()

  const state = getState()
  syncPlayerUI(state)

  const unsubscribe = subscribe((nextState) => {
    syncPlayerUI(nextState)
  })

  return () => {
    unsubscribe()
  }
}
