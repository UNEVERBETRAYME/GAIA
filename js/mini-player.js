import { togglePlay, subscribe, prevTrack, nextTrack } from './music-player.js'

const STORAGE_KEY = 'gaia-mini-player-pos'
const EDGE_SNAP_PX = 24
const MOVE_THRESHOLD = 5
const COLLAPSE_DELAY = 1500

let playerEl = null
let innerEl = null
let artEl = null
let nameEl = null
let artistEl = null
let iconEl = null

const ICONS = {
  prev: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6v12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M18 7l-8 5 8 5V7z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`,
  next: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6v12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M6 7l8 5-8 5V7z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`,
  play: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 7l10 5-10 5V7z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`,
  pause: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 7v10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M15 7v10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
}
let currentDock = 'none'
let collapseTimer = null
let touchExpanded = false

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

function clearCollapseTimer() {
  if (collapseTimer) {
    clearTimeout(collapseTimer)
    collapseTimer = null
  }
}

function setExpanded(expanded) {
  if (!playerEl) return
  playerEl.classList.toggle('expanded', expanded)
  playerEl.classList.toggle('collapsed', !expanded)
}

function canAutoCollapse() {
  return currentDock !== 'none' && !playerEl.classList.contains('dragging')
}

function scheduleCollapse() {
  clearCollapseTimer()
  if (!canAutoCollapse()) return
  collapseTimer = setTimeout(() => {
    if (canAutoCollapse()) {
      setExpanded(false)
      touchExpanded = false
    }
  }, COLLAPSE_DELAY)
}

function applyDockClass(dock) {
  playerEl.classList.remove('dock-left', 'dock-right', 'dock-none')
  playerEl.classList.add(`dock-${dock}`)

  if (dock === 'none') {
    setExpanded(true)
  } else {
    setExpanded(false)
    scheduleCollapse()
  }
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

function applyCover(state) {
  if (!state.song) return
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

function setButtonIcon(el, iconMarkup) {
  if (!el) return
  if (el.innerHTML !== iconMarkup) {
    el.innerHTML = iconMarkup
  }
}

function initExpandBehavior() {
  const supportsHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches

  if (supportsHover) {
    playerEl.addEventListener('pointerenter', () => {
      if (currentDock === 'none') return
      clearCollapseTimer()
      setExpanded(true)
    })

    playerEl.addEventListener('pointerleave', () => {
      if (currentDock === 'none') return
      scheduleCollapse()
    })
    return
  }

  playerEl.addEventListener('pointerup', (e) => {
    if (playerEl.classList.contains('dragging')) return
    if (currentDock === 'none') return

    if (!touchExpanded) {
      touchExpanded = true
      setExpanded(true)
      scheduleCollapse()
    }
  })

  document.addEventListener('pointerdown', (e) => {
    if (currentDock === 'none') return
    if (!touchExpanded) return
    if (playerEl.contains(e.target)) return
    touchExpanded = false
    setExpanded(false)
    clearCollapseTimer()
  })
}

function initDrag() {
  let didMove = false
  let startX = 0
  let startY = 0
  let originX = 0
  let originY = 0

  function onPointerDown(e) {
    if (e.button && e.button !== 0) return
    if (e.target.closest('button, a')) return

    clearCollapseTimer()

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
      clearCollapseTimer()
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

    playerEl.style.transition = 'left 0.28s cubic-bezier(0.22, 0.61, 0.36, 1), top 0.18s ease, opacity var(--dur-base) var(--ease-smooth)'
    applyPosition(final.x, final.y)
    savePos(final.x, final.y, currentDock)

    setTimeout(() => {
      playerEl.style.transition = 'opacity var(--dur-base) var(--ease-smooth)'
      scheduleCollapse()
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
  wrapper.className = 'mini-player dock-none expanded'
  wrapper.innerHTML = `
    <div class="mini-player__inner">
      <div class="mini-player__art" id="miniPlayerArt"></div>
      <div class="mini-player__info">
        <div class="mini-player__name" id="miniPlayerName">未播放</div>
        <div class="mini-player__artist" id="miniPlayerArtist"></div>
      </div>
      <button class="player-btn mini-player__btn" id="miniPlayerPrev" aria-label="上一首">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 6v12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path d="M18 7l-8 5 8 5V7z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
        </svg>
      </button>
      <button class="player-btn player-btn--primary mini-player__btn" id="miniPlayerPlay" aria-label="播放">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 7l10 5-10 5V7z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
        </svg>
      </button>
      <button class="player-btn mini-player__btn" id="miniPlayerNext" aria-label="下一首">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M18 6v12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path d="M6 7l8 5-8 5V7z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
        </svg>
      </button>
      <a href="/pages/music.html" class="mini-player__link" id="miniPlayerLink" aria-label="音乐页">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 18V6l10-2v12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="7" cy="18" r="2" fill="none" stroke="currentColor" stroke-width="2"/>
          <circle cx="17" cy="16" r="2" fill="none" stroke="currentColor" stroke-width="2"/>
        </svg>
      </a>
    </div>
  `
  document.body.appendChild(wrapper)

  playerEl = wrapper
  innerEl = wrapper.querySelector('.mini-player__inner')
  artEl = document.getElementById('miniPlayerArt')
  nameEl = document.getElementById('miniPlayerName')
  artistEl = document.getElementById('miniPlayerArtist')
  iconEl = document.getElementById('miniPlayerPlay')
  setButtonIcon(document.getElementById('miniPlayerPrev'), ICONS.prev)
  setButtonIcon(document.getElementById('miniPlayerNext'), ICONS.next)

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

  document.getElementById('miniPlayerPrev').addEventListener('click', () => {
    if (!playerEl.classList.contains('dragging')) {
      prevTrack()
    }
  })

  document.getElementById('miniPlayerPlay').addEventListener('click', () => {
    if (!playerEl.classList.contains('dragging')) {
      togglePlay()
    }
  })

  document.getElementById('miniPlayerNext').addEventListener('click', () => {
    if (!playerEl.classList.contains('dragging')) {
      nextTrack()
    }
  })

  subscribe((state) => {
    if (state.song) {
      playerEl.classList.add('visible')
      applyCover(state)
      nameEl.textContent = state.song.name
      artistEl.textContent = state.playlistName || state.song.artist
      setButtonIcon(iconEl, state.isPlaying ? ICONS.pause : ICONS.play)
      document.getElementById('miniPlayerPlay').setAttribute('aria-label', state.isPlaying ? '暂停' : '播放')
    } else {
      playerEl.classList.remove('visible')
    }
  })

  initExpandBehavior()
  initDrag()
  initResizeCorrection()
}
