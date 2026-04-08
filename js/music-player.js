import { allSongs, findSongBySrc } from './music-data.js'
import { getAudioArt } from './audio-art.js'

const STORAGE_KEY = 'gaia-music-state'

const audio = new Audio()
audio.preload = 'metadata'

let currentSong = null
let playlistName = ''
let currentIndex = -1
let shuffle = false
let shuffleHistory = []
let coverUrl = ''
const listeners = new Set()

function getState() {
  return {
    song: currentSong,
    playlistName,
    isPlaying: !audio.paused,
    currentTime: audio.currentTime,
    duration: audio.duration || 0,
    src: audio.src || '',
    shuffle,
    hasPrev: currentIndex !== -1,
    hasNext: currentIndex !== -1,
    coverUrl,
  }
}

function notify() {
  const state = getState()
  listeners.forEach((fn) => fn(state))
}

function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function findIndexBySong(song) {
  if (!song || !song.src) return -1
  return allSongs.findIndex((s) => s.src === song.src)
}

function hydrateSong(song) {
  if (!song) return null
  const bySrc = findSongBySrc(song.src)
  if (bySrc) return bySrc
  return song
}

function setCover(art) {
  coverUrl = art || ''
  notify()
}

async function resolveCoverForSong(song) {
  if (!song || !song.src) {
    setCover('')
    return
  }
  const art = await getAudioArt(song.src)
  if (currentSong && currentSong.src === song.src) {
    setCover(art || '')
  }
}

function saveState() {
  if (!currentSong) return
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      src: currentSong.src,
      name: currentSong.name,
      artist: currentSong.artist,
      mood: currentSong.mood,
      gradient: currentSong.gradient,
      playlistName,
      currentTime: audio.currentTime,
      isPlaying: !audio.paused,
      shuffle,
      currentIndex,
      shuffleHistory,
    }))
  } catch {}
}

function setCurrentByIndex(index, shouldPlay = true) {
  if (index < 0 || index >= allSongs.length) return Promise.resolve(false)

  currentIndex = index
  currentSong = allSongs[index]
  playlistName = currentSong.playlistName || currentSong.artist || ''
  coverUrl = ''
  audio.src = currentSong.src
  audio.load()
  resolveCoverForSong(currentSong)

  if (!shouldPlay) {
    saveState()
    notify()
    return Promise.resolve(true)
  }

  return audio.play().then(() => {
    saveState()
    notify()
    return true
  }).catch(() => {
    notify()
    return false
  })
}

function restoreState() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const data = JSON.parse(raw)
    if (!data.src) return

    const song = hydrateSong({
      name: data.name || '未知',
      artist: data.artist || '',
      mood: data.mood || '',
      gradient: data.gradient || 'linear-gradient(135deg, #1a2535, #0d1520)',
      src: data.src,
      playlistName: data.playlistName || '',
    })

    currentSong = song
    playlistName = data.playlistName || song.playlistName || song.artist || ''

    const foundIndex = findIndexBySong(song)
    if (typeof data.currentIndex === 'number' && data.currentIndex >= 0 && data.currentIndex < allSongs.length) {
      currentIndex = data.currentIndex
    } else {
      currentIndex = foundIndex
    }

    shuffle = !!data.shuffle
    shuffleHistory = Array.isArray(data.shuffleHistory)
      ? data.shuffleHistory.filter((n) => Number.isInteger(n) && n >= 0 && n < allSongs.length)
      : []

    coverUrl = ''
    audio.src = song.src
    resolveCoverForSong(song)

    if (data.currentTime > 0) {
      audio.currentTime = data.currentTime
    }

    if (data.isPlaying) {
      audio.play().catch(() => {})
    }

    notify()
  } catch {}
}

audio.addEventListener('loadedmetadata', () => {
  saveState()
  notify()
})

audio.addEventListener('timeupdate', () => {
  if (Math.floor(audio.currentTime) % 2 === 0) {
    saveState()
  }
  notify()
})

audio.addEventListener('ended', () => {
  nextTrack().catch(() => {
    saveState()
    notify()
  })
})

audio.addEventListener('error', () => {
  notify()
})

audio.addEventListener('play', () => {
  saveState()
  notify()
})

audio.addEventListener('pause', () => {
  saveState()
  notify()
})

function playSong(song, plName) {
  const hydrated = hydrateSong(song)
  const idx = findIndexBySong(hydrated)
  if (idx !== -1) {
    currentIndex = idx
    currentSong = allSongs[idx]
    playlistName = plName || currentSong.playlistName || currentSong.artist || ''
  } else {
    currentSong = hydrated
    playlistName = plName || hydrated.artist || ''
    currentIndex = -1
  }

  coverUrl = ''
  resolveCoverForSong(currentSong)

  audio.src = hydrated.src
  audio.load()
  audio.play().then(() => {
    saveState()
    notify()
  }).catch(() => {
    notify()
  })
}

function togglePlay() {
  if (!currentSong) return
  if (audio.paused) {
    audio.play().catch(() => {})
  } else {
    audio.pause()
  }
}

function setShuffle(enabled) {
  shuffle = !!enabled
  if (!shuffle) {
    shuffleHistory = []
  }
  saveState()
  notify()
}

function toggleShuffle() {
  setShuffle(!shuffle)
}

function nextTrack() {
  if (allSongs.length === 0) return Promise.resolve(false)

  if (currentIndex === -1) {
    const fallback = currentSong ? findIndexBySong(currentSong) : 0
    currentIndex = fallback === -1 ? 0 : fallback
  }

  let nextIndex = currentIndex

  if (shuffle) {
    if (allSongs.length === 1) {
      nextIndex = 0
    } else {
      shuffleHistory.push(currentIndex)
      do {
        nextIndex = Math.floor(Math.random() * allSongs.length)
      } while (nextIndex === currentIndex)
    }
  } else {
    nextIndex = (currentIndex + 1) % allSongs.length
  }

  return setCurrentByIndex(nextIndex, true)
}

function prevTrack() {
  if (allSongs.length === 0) return Promise.resolve(false)

  if (currentIndex === -1) {
    const fallback = currentSong ? findIndexBySong(currentSong) : 0
    currentIndex = fallback === -1 ? 0 : fallback
  }

  let prevIndex = currentIndex

  if (shuffle) {
    if (shuffleHistory.length > 0) {
      prevIndex = shuffleHistory.pop()
    } else {
      prevIndex = (currentIndex - 1 + allSongs.length) % allSongs.length
    }
  } else {
    prevIndex = (currentIndex - 1 + allSongs.length) % allSongs.length
  }

  return setCurrentByIndex(prevIndex, true)
}

function seekTo(percent) {
  if (!audio.duration) return
  audio.currentTime = percent * audio.duration
  notify()
}

function seekToTime(time) {
  if (!audio.duration) return
  audio.currentTime = time
  notify()
}

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00'
  const min = Math.floor(seconds / 60)
  const sec = Math.round(seconds % 60)
  return `${min}:${sec.toString().padStart(2, '0')}`
}

export {
  audio,
  getState,
  subscribe,
  playSong,
  togglePlay,
  setShuffle,
  toggleShuffle,
  nextTrack,
  prevTrack,
  seekTo,
  seekToTime,
  formatTime,
  restoreState,
}
