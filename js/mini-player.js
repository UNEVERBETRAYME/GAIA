import { togglePlay, subscribe } from './music-player.js'

const STORAGE_KEY = 'gaia-mini-player-pos'
const SNAP_THRESHOLD = 0.5

let playerEl = null
let innerEl = null
let artEl = null
let nameEl = null
let artistEl = null
let iconEl = null

function loadSavedPos() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const pos = JSON.parse(raw)
    if (typeof pos.x === 'number' && typeof pos.y === 'number') return pos
  } catch {}
  return null
}

function savePos(x, y) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ x, y }))
  } catch {}
}

function clampToViewport(x, y) {
  const rect = playerEl.getBoundingClientRect()
  const vw = window.innerWidth
  const vh = window.innerHeight
  const margin = 8

  x = Math.max(margin, Math.min(x, vw - rect.width - margin))
  y = Math.max(margin, Math.min(y, vh - rect.height - margin))

  return { x, y }
}

function snapToEdge(x) {
  const rect = playerEl.getBoundingClientRect()
  const vw = window.innerWidth
  const centerX = x + rect.width / 2

  if (centerX < vw * SNAP_THRESHOLD) {
    return 8
  } else {
    return vw - rect.width - 8
  }
}

function applyPosition(x, y) {
  playerEl.style.left = x + 'px'
  playerEl.style.top = y + 'px'
}

function getDefaultPosition() {
  const rect = playerEl.getBoundingClientRect()
  const vw = window.innerWidth
  const vh = window.innerHeight
  const margin = 8

  const x = (vw - rect.width) / 2
  const y = vh - rect.height - margin

  return clampToViewport(x, y)
}

function initDrag() {
  let didMove = false
  let startX = 0
  let startY = 0
  let originX = 0
  let originY = 0

  function onPointerDown(e) {
    if (e.button && e.button !== 0) return

    const rect = playerEl.getBoundingClientRect()
    startX = e.clientX
    startY = e.clientY
    originX = rect.left
    originY = rect.top
    didMove = false

    playerEl.setPointerCapture(e.pointerId)
    playerEl.classList.add('dragging')
  }

  function onPointerMove(e) {
    if (!playerEl.hasPointerCapture(e.pointerId)) return

    const dx = e.clientX - startX
    const dy = e.clientY - startY

    if (!didMove && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
      didMove = true
    }

    if (!didMove) return

    const rawX = originX + dx
    const rawY = originY + dy
    const clamped = clampToViewport(rawX, rawY)
    applyPosition(clamped.x, clamped.y)
  }

  function onPointerUp(e) {
    if (!playerEl.hasPointerCapture(e.pointerId)) return
    playerEl.releasePointerCapture(e.pointerId)
    playerEl.classList.remove('dragging')

    if (didMove) {
      const rect = playerEl.getBoundingClientRect()
      const snappedX = snapToEdge(rect.left)
      const clamped = clampToViewport(snappedX, rect.top)

      innerEl.style.transition = 'transform 0.3s cubic-bezier(0.22, 0.61, 0.36, 1)'
      innerEl.style.transform = 'translateY(0)'

      applyPosition(clamped.x, clamped.y)
      savePos(clamped.x, clamped.y)

      setTimeout(() => {
        innerEl.style.transition = ''
      }, 350)

      e.preventDefault()
    }
  }

  function onClick(e) {
    if (didMove) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  playerEl.addEventListener('pointerdown', onPointerDown)
  playerEl.addEventListener('pointermove', onPointerMove)
  playerEl.addEventListener('pointerup', onPointerUp)
  playerEl.addEventListener('pointercancel', onPointerUp)
  playerEl.addEventListener('click', onClick, true)
}

function initResizeCorrection() {
  let resizeTimer = null

  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => {
      if (!playerEl) return
      const rect = playerEl.getBoundingClientRect()
      const clamped = clampToViewport(rect.left, rect.top)
      if (clamped.x !== rect.left || clamped.y !== rect.top) {
        applyPosition(clamped.x, clamped.y)
        savePos(clamped.x, clamped.y)
      }
    }, 200)
  }, { passive: true })
}

export function initMiniPlayer() {
  const wrapper = document.createElement('div')
  wrapper.id = 'miniPlayer'
  wrapper.className = 'mini-player'
  wrapper.innerHTML = `
    <div class="mini-player__inner">
      <div class="mini-player__art" id="miniPlayerArt"></div>
      <div class="mini-player__info">
        <div class="mini-player__name" id="miniPlayerName">未播放</div>
        <div class="mini-player__artist" id="miniPlayerArtist"></div>
      </div>
      <button class="mini-player__play" id="miniPlayerPlay" aria-label="播放">
        <span class="mini-player__play-icon" id="miniPlayerPlayIcon">▶</span>
      </button>
      <a href="/pages/music.html" class="mini-player__link" id="miniPlayerLink" aria-label="音乐页">🎵</a>
    </div>
  `
  document.body.appendChild(wrapper)

  playerEl = wrapper
  innerEl = wrapper.querySelector('.mini-player__inner')
  artEl = document.getElementById('miniPlayerArt')
  nameEl = document.getElementById('miniPlayerName')
  artistEl = document.getElementById('miniPlayerArtist')
  iconEl = document.getElementById('miniPlayerPlayIcon')

  const saved = loadSavedPos()
  if (saved) {
    const clamped = clampToViewport(saved.x, saved.y)
    applyPosition(clamped.x, clamped.y)
  } else {
    requestAnimationFrame(() => {
      const pos = getDefaultPosition()
      applyPosition(pos.x, pos.y)
    })
  }

  document.getElementById('miniPlayerPlay').addEventListener('click', (e) => {
    if (!playerEl.classList.contains('dragging')) {
      togglePlay()
    }
  })

  subscribe((state) => {
    if (state.song) {
      playerEl.classList.add('visible')
      innerEl.style.transform = 'translateY(0)'
      artEl.style.background = state.song.gradient
      nameEl.textContent = state.song.name
      artistEl.textContent = state.playlistName || state.song.artist
      iconEl.textContent = state.isPlaying ? '⏸' : '▶'
    } else {
      playerEl.classList.remove('visible')
    }
  })

  initDrag()
  initResizeCorrection()
}
