/**
 * mini-player.js - 全局迷你播放器（支持拖拽）
 * 职责：创建 DOM、拖拽移动、左右边缘吸附、位置持久化、viewport resize 修正
 */

import { togglePlay, subscribe } from './music-player.js'

const STORAGE_KEY = 'gaia-mini-player-pos'
const SNAP_THRESHOLD = 0.5 // 拖拽结束后，距离哪边更近就吸附到哪边

let playerEl = null
let artEl = null
let nameEl = null
let artistEl = null
let iconEl = null

// ---- 位置持久化 ----

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

// ---- 边界限制 ----

function clampToViewport(x, y) {
  const rect = playerEl.getBoundingClientRect()
  const vw = window.innerWidth
  const vh = window.innerHeight
  const margin = 8

  x = Math.max(margin, Math.min(x, vw - rect.width - margin))
  y = Math.max(margin, Math.min(y, vh - rect.height - margin))

  return { x, y }
}

// ---- 吸附到左/右边缘 ----

function snapToEdge(x) {
  const rect = playerEl.getBoundingClientRect()
  const vw = window.innerWidth
  const centerX = x + rect.width / 2
  const margin = 8

  if (centerX < vw * SNAP_THRESHOLD) {
    return margin
  } else {
    return vw - rect.width - margin
  }
}

// ---- 应用位置（用 left/top，不干扰 transform 动画） ----

function applyPosition(x, y) {
  playerEl.style.left = x + 'px'
  playerEl.style.top = y + 'px'
  playerEl.style.transform = 'translateY(0)'
}

// ---- 拖拽逻辑 ----

function initDrag() {
  let isDragging = false
  let didMove = false
  let startX = 0
  let startY = 0
  let originX = 0
  let originY = 0

  function onPointerDown(e) {
    // 只响应左键（鼠标）或任意键（触摸）
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

    // 移动超过 5px 才算开始拖拽（区分点击和拖拽）
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
      // 拖拽结束 → 吸附到最近的边缘
      const rect = playerEl.getBoundingClientRect()
      const snappedX = snapToEdge(rect.left)
      const clamped = clampToViewport(snappedX, rect.top)

      playerEl.style.transition = 'left 0.3s cubic-bezier(0.22, 0.61, 0.36, 1), top 0.15s ease'
      applyPosition(clamped.x, clamped.y)
      savePos(clamped.x, clamped.y)

      // 移除过渡（避免影响后续拖拽）
      setTimeout(() => {
        playerEl.style.transition = ''
      }, 350)

      e.preventDefault()
    }
  }

  function onClick(e) {
    // 如果发生了拖拽，阻止 click 事件触发播放/暂停
    if (didMove) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  playerEl.addEventListener('pointerdown', onPointerDown)
  playerEl.addEventListener('pointermove', onPointerMove)
  playerEl.addEventListener('pointerup', onPointerUp)
  playerEl.addEventListener('pointercancel', onPointerUp)
  playerEl.addEventListener('click', onClick, true) // capture 阶段拦截
}

// ---- viewport resize 修正 ----

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

// ---- 初始化 ----

export function initMiniPlayer() {
  const el = document.createElement('div')
  el.id = 'miniPlayer'
  el.className = 'mini-player'
  el.innerHTML = `
    <div class="mini-player__art" id="miniPlayerArt"></div>
    <div class="mini-player__info">
      <div class="mini-player__name" id="miniPlayerName">未播放</div>
      <div class="mini-player__artist" id="miniPlayerArtist"></div>
    </div>
    <button class="mini-player__play" id="miniPlayerPlay" aria-label="播放">
      <span class="mini-player__play-icon" id="miniPlayerPlayIcon">▶</span>
    </button>
    <a href="/pages/music.html" class="mini-player__link" id="miniPlayerLink" aria-label="音乐页">🎵</a>
  `
  document.body.appendChild(el)

  playerEl = el
  artEl = document.getElementById('miniPlayerArt')
  nameEl = document.getElementById('miniPlayerName')
  artistEl = document.getElementById('miniPlayerArtist')
  iconEl = document.getElementById('miniPlayerPlayIcon')

  // 恢复上次保存的位置
  const saved = loadSavedPos()
  if (saved) {
    const clamped = clampToViewport(saved.x, saved.y)
    applyPosition(clamped.x, clamped.y)
  }

  // 播放/暂停按钮
  document.getElementById('miniPlayerPlay').addEventListener('click', (e) => {
    if (!playerEl.classList.contains('dragging')) {
      togglePlay()
    }
  })

  // 订阅播放状态
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

  // 初始化拖拽和 resize
  initDrag()
  initResizeCorrection()
}
