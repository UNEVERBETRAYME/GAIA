import { allSongs, findSongBySrc } from './music-data.js'
import { getAudioMetadata } from './audio-art.js'

const STORAGE_KEY = 'gaia-music-state'
const DEFAULT_SONG_SRC = '/audio/Tears4MaLuv.mp3'
const DEFAULT_VOLUME = 0.3

const audio = new Audio()
audio.preload = 'metadata'
audio.volume = DEFAULT_VOLUME

let currentSong = null
let playlistName = ''
let currentIndex = -1
let shuffle = false
let shuffleHistory = []
let coverUrl = ''
let volume = DEFAULT_VOLUME
let pendingRestoreTime = 0
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
    shuffleEnabled: shuffle,
    hasPrev: currentIndex !== -1,
    hasNext: currentIndex !== -1,
    coverUrl,
    volume,
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

function getDefaultSong() {
  return findSongBySrc(DEFAULT_SONG_SRC)
}

function setCover(art) {
  coverUrl = art || ''
  notify()
}

async function resolveMetadataForSong(song) {
  if (!song || !song.src) {
    setCover('')
    return
  }

  try {
    const metadata = await getAudioMetadata(song.src)

    // 确保仍然是当前歌曲（避免快速切歌时覆盖错误）
    if (currentSong && currentSong.src === song.src) {
      // 更新 ID3 信息
      if (metadata) {
        if (metadata.title) {
          currentSong.name = metadata.title
        }
        if (metadata.artist) {
          currentSong.artist = metadata.artist
        }
        if (metadata.coverUrl) {
          setCover(metadata.coverUrl)
        } else {
          setCover('')
        }
      } else {
        setCover('')
      }

      notify()
    }
  } catch (error) {
    console.warn('加载 ID3 元数据失败:', error)
    setCover('')
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
      volume,
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
  resolveMetadataForSong(currentSong)
  notify()

  if (!shouldPlay) {
    saveState()
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

    if (typeof data.volume === 'number' && data.volume >= 0 && data.volume <= 1) {
      volume = data.volume
      audio.volume = volume
    }

    coverUrl = ''
    audio.src = song.src
    resolveMetadataForSong(song)

    pendingRestoreTime = data.currentTime > 0 ? data.currentTime : 0

    if (data.isPlaying) {
      audio.play().catch(() => {})
    }

    notify()
  } catch {}
}

audio.addEventListener('loadedmetadata', () => {
  if (pendingRestoreTime > 0 && audio.duration) {
    audio.currentTime = Math.min(pendingRestoreTime, audio.duration)
    pendingRestoreTime = 0
  }
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
  if (!hydrated) return Promise.resolve(false)

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
  resolveMetadataForSong(currentSong)

  audio.src = hydrated.src
  audio.load()
  notify()

  return audio.play().then(() => {
    saveState()
    notify()
    return true
  }).catch(() => {
    notify()
    return false
  })
}

function togglePlay() {
  if (!currentSong) {
    const defaultSong = getDefaultSong()
    if (!defaultSong) return
    setShuffle(true)
    playSong(defaultSong, defaultSong.playlistName || '').catch(() => {})
    return
  }

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
    const fallbackSong = currentSong || getDefaultSong()
    const fallback = fallbackSong ? findIndexBySong(fallbackSong) : 0
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

  return setCurrentByIndex(nextIndex, true).then((ok) => {
    if (ok) return true

    if (shuffle && allSongs.length > 1) {
      let fallbackIndex = currentIndex
      do {
        fallbackIndex = Math.floor(Math.random() * allSongs.length)
      } while (fallbackIndex === currentIndex)
      return setCurrentByIndex(fallbackIndex, true)
    }

    const defaultSong = getDefaultSong()
    if (!defaultSong) return false
    return playSong(defaultSong, defaultSong.playlistName || '')
  })
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
  audio.currentTime = Math.max(0, Math.min(1, percent)) * audio.duration
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
  const sec = Math.floor(seconds % 60)
  return `${min}:${sec.toString().padStart(2, '0')}`
}

function setVolume(value) {
  const clamped = Math.max(0, Math.min(1, value))
  volume = clamped
  audio.volume = clamped
  saveState()
  notify()
}

function getVolume() {
  return volume
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
  setVolume,
  getVolume,
}
