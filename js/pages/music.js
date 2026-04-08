import { playlistsData, allSongs, getMoodLabel, findSongByKey } from '../music-data.js'
import { getState, subscribe, playSong, togglePlay, seekTo, formatTime } from '../music-player.js'

let unsubscribe = null

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

function syncPlayerUI(state) {
  if (!state.song) return

  document.getElementById('playerArt').style.background = state.song.gradient
  document.getElementById('playerTitle').textContent = state.song.name
  document.getElementById('playerArtist').textContent = state.playlistName || state.song.artist
  document.getElementById('playerMood').textContent = getMoodLabel(state.song.mood)

  if (state.duration > 0) {
    document.getElementById('totalTime').textContent = formatTime(state.duration)
  }

  if (state.currentTime > 0) {
    document.getElementById('currentTime').textContent = formatTime(state.currentTime)
    const percent = (state.currentTime / state.duration) * 100
    document.getElementById('progressFill').style.width = `${percent}%`
  }

  const playIcon = document.getElementById('playIcon')
  if (state.isPlaying) {
    playIcon.textContent = '⏸'
    playIcon.classList.add('spinning')
  } else {
    playIcon.textContent = '▶'
    playIcon.classList.remove('spinning')
  }

  document.querySelectorAll('.music-song').forEach((el) => el.classList.remove('active'))
  if (state.song._key) {
    const songEl = document.querySelector(`.music-song[data-key="${state.song._key}"]`)
    if (songEl) songEl.classList.add('active')
  }
}

function initPlayerControls() {
  const playBtn = document.getElementById('playBtn')
  const playIcon = document.getElementById('playIcon')

  playBtn.addEventListener('click', () => {
    togglePlay()
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

export function initMusicPage() {
  renderPlaylists()
  initPlayerControls()
  initMoodTags()

  const state = getState()
  if (state.song) {
    syncPlayerUI(state)
  }

  unsubscribe = subscribe((state) => {
    syncPlayerUI(state)
  })
}

export function teardownMusicPage() {
  if (unsubscribe) {
    unsubscribe()
    unsubscribe = null
  }
}
