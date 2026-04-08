import { findSongBySrc } from './music-data.js'

const STORAGE_KEY = 'gaia-music-state'

const audio = new Audio()
audio.preload = 'metadata'

let currentSong = null
let playlistName = ''
const listeners = new Set()

function getState() {
  return {
    song: currentSong,
    playlistName,
    isPlaying: !audio.paused,
    currentTime: audio.currentTime,
    duration: audio.duration || 0,
    src: audio.src || '',
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
    }))
  } catch {}
}

function restoreState() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const data = JSON.parse(raw)
    if (!data.src) return
    const song = findSongBySrc(data.src) || {
      name: data.name || '未知',
      artist: data.artist || '',
      mood: data.mood || '',
      gradient: data.gradient || 'linear-gradient(135deg, #1a2535, #0d1520)',
      src: data.src,
    }
    currentSong = song
    playlistName = data.playlistName || song.artist || ''
    audio.src = song.src
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
  saveState()
  notify()
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
  currentSong = song
  playlistName = plName || song.artist || ''
  audio.src = song.src
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
  seekTo,
  seekToTime,
  formatTime,
  restoreState,
}
