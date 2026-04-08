import { togglePlay, subscribe } from './music-player.js'

const STORAGE_KEY = 'gaia-mini-player-pos'
const EDGE_SNAP_PX = 24
const MOVE_THRESHOLD = 5

let playerEl = null
let innerEl = null
let artEl = null
let nameEl = null
let artistEl = null
let iconEl = null

let currentDock = 'none'

function getLayoutBounds() {
  const margin = 8
  const vw = window.innerWidth
  const vh = window.innerHeight
  const nav = document.getElementById('mainNav')
  const footer = document.querySelector('.footer')

  const navHeight = nav ? nav.getBoundingClientRect().height : 72
  const footerHeight = footer ? footer.getBoundingClientRect().height : 92

  return {
    vw,
    vh,
    margin,
    minY: navHeight + margin,
    maxYBase: vh - footerHeight - margin,
  }
}

function loadSavedPos() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const pos = JSON.parse(raw)
    if (typeof pos.x !== 'number' || typeof pos.y !== 'number') return null
    if (!['left', 'right', 'none'].includes(pos.dock)) {
      pos.dock = 'none'
    }
    return pos
  } catch {
    return null
  }
}

function savePos(x, y, dock) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ x, y, dock }))
  } catch {}
}

function clampToViewport(x, y) {
  const rect = playerEl.getBoundingClientRect()
  const { vw, minY, maxYBase, margin } = getLayoutBounds()

  const maxX = vw - rect.width - margin
  const maxY = maxYBase - rect.height

  return {
    x: Math.max(margin, Math.min(x, maxX)),
    y: Math.max(minY, Math.min(y, maxY)),
  }
}

function resolveDockTarget(rect) {
  const { vw, margin } = getLayoutBounds()
  const distLeft = rect.left
  const distRight = vw - rect.right

  if (distLeft <= EDGE_SNAP_PX) {
    return { dock: 'left', x: margin }
  }
  if (distRight <= EDGE_SNAP_PX) {
    return { dock: 'right', x: vw - rect.width - margin }
  }
  return { dock: 'none', x: rect.left }
}

function applyDockClass(dock) {
  playerEl.classList.remove('dock-left', 'dock-right', 'dock-none')
  playerEl.classList.add(`dock-${dock}`)
}

function applyPosition(x, y) {
  playerEl.style.left = `${x}px`
  playerEl.style.top = `${y}px`
}

function getDefaultPosition() {
  const rect = playerEl.getBoundingClientRect()
  const { vw, maxYBase } = getLayoutBounds()

  const x = (vw - rect.width) / 2
  const y = maxYBase - rect.height

  return clampToViewport(x, y)
}

function normalizePositionByDock(x, y, dock) {
  const rect = playerEl.getBoundingClientRect()
  const { vw, margin } = getLayoutBounds()

  if (dock === 'left') {
    return clampToViewport(margin, y)
  }
  if (dock === 'right') {
    return clampToViewport(vw - rect.width - margin, y)
  }
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

    if (!didMove && (Math.abs(dx) > MOVE_THRESHOLD || Math.abs(dy) > MOVE_THRESHOLD)) {
      didMove = true
      currentDock = 'none'
      applyDockClass(currentDock)
    }

    if (!didMove) return

    const clamped = clampToViewport(originX + dx, originY + dy)
    applyPosition(clamped.x, clamped.y)
  }

  function onPointerUp(e) {
    if (!playerEl.hasPointerCapture(e.pointerId)) return

    playerEl.releasePointerCapture(e.pointerId)
    playerEl.classList.remove('dragging')

    if (!didMove) return

    const rect = playerEl.getBoundingClientRect()
    const snap = resolveDockTarget(rect)
    const final = clampToViewport(snap.x, rect.top)

    currentDock = snap.dock
    applyDockClass(currentDock)

    playerEl.style.transition = 'left 0.28s cubic-bezier(0.22, 0.61, 0.36, 1), top 0.18s ease'
    applyPosition(final.x, final.y)
    savePos(final.x, final.y, currentDock)

    setTimeout(() => {
      playerEl.style.transition = 'opacity var(--dur-base) var(--ease-smooth)'
    }, 320)

    e.preventDefault()
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
  let timer = null

  window.addEventListener('resize', () => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      if (!playerEl) return

      const rect = playerEl.getBoundingClientRect()
      const corrected = normalizePositionByDock(rect.left, rect.top, currentDock)

      applyPosition(corrected.x, corrected.y)
      savePos(corrected.x, corrected.y, currentDock)
    }, 160)
  }, { passive: true })
}

export function initMiniPlayer() {
  const wrapper = document.createElement('div')
  wrapper.id = 'miniPlayer'
  wrapper.className = 'mini-player dock-none'
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
  requestAnimationFrame(() => {
    if (saved) {
      currentDock = saved.dock || 'none'
      const restored = normalizePositionByDock(saved.x, saved.y, currentDock)
      applyDockClass(currentDock)
      applyPosition(restored.x, restored.y)
      savePos(restored.x, restored.y, currentDock)
    } else {
      currentDock = 'none'
      applyDockClass(currentDock)
      const initial = getDefaultPosition()
      applyPosition(initial.x, initial.y)
      savePos(initial.x, initial.y, currentDock)
    }
  })

  document.getElementById('miniPlayerPlay').addEventListener('click', () => {
    if (!playerEl.classList.contains('dragging')) {
      togglePlay()
    }
  })

  subscribe((state) => {
    if (state.song) {
      playerEl.classList.add('visible')
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
