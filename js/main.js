import { initNav } from './nav.js'
import { getState, subscribe, togglePlay, formatTime, restoreState } from './music-player.js'
import { getMoodLabel } from './music-data.js'
import { initMiniPlayer } from './mini-player.js'

import { initIndexPage } from './pages/index.js'
import { initAIPage } from './pages/ai.js'
import { initMusicPage, teardownMusicPage } from './pages/music.js'
import { initGameArtPage } from './pages/game-art.js'
import { initWordsPage } from './pages/words.js'
import { initKookPage } from './pages/kook.js'
import { initAboutPage } from './pages/about.js'

const PAGE_CSS_MAP = {
  'index': '/css/pages/index.css',
  'ai': '/css/pages/ai.css',
  'music': '/css/pages/music.css',
  'game-art': '/css/pages/game-art.css',
  'words': '/css/pages/words.css',
  'kook': '/css/pages/kook.css',
  'about': '/css/pages/about.css',
}

function swapPageCSS(key) {
  // Remove previous page's dynamic CSS link
  const prev = document.querySelector('link[data-page-style]')
  if (prev) prev.remove()

  const href = PAGE_CSS_MAP[key]
  if (!href) return

  // Check if this CSS is already loaded statically (direct load / refresh case)
  const existing = document.querySelector(`link[href="${href}"]`)
  if (existing) return

  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = href
  link.dataset.pageStyle = key
  document.head.appendChild(link)
}

function initPageTransition() {
  document.body.classList.remove('page-loading')
  document.body.classList.add('page-enter')

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.body.classList.add('page-enter-active')
    })
  })
}

function initScrollReveal() {
  const elements = document.querySelectorAll('.scroll-reveal')
  if (elements.length === 0) return

  if (!window._revealObserver) {
    window._revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed')
            window._revealObserver.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    )
  }

  elements.forEach((el) => {
    window._revealObserver.observe(el)
  })
}

const pageModules = {
  'index': initIndexPage,
  'ai': initAIPage,
  'music': initMusicPage,
  'game-art': initGameArtPage,
  'words': initWordsPage,
  'kook': initKookPage,
  'about': initAboutPage,
}

function getPageKey() {
  const path = window.location.pathname
  if (path === '/' || path === '/index.html') return 'index'
  const match = path.match(/\/pages\/([^.]+)\.html/)
  return match ? match[1] : 'index'
}

let currentPageKey = null

function runPageInit(key) {
  if (currentPageKey === 'music' && key !== 'music') {
    teardownMusicPage()
  }

  currentPageKey = key
  const initFn = pageModules[key]
  if (initFn) initFn()
}

function interceptLinks() {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]')
    if (!link) return

    const href = link.getAttribute('href')
    if (!href) return

    if (link.target === '_blank' || link.hasAttribute('download')) return
    if (!href.startsWith('/') && !href.startsWith(window.location.origin)) return
    if (href.endsWith('.mp3') || href.endsWith('.wav') || href.endsWith('.ogg')) return
    if (href.includes('#') && link.origin === window.location.origin) return

    let url
    try {
      url = new URL(href, window.location.origin)
    } catch { return }

    if (url.origin !== window.location.origin) return
    if (!url.pathname.endsWith('.html') && url.pathname !== '/') return

    e.preventDefault()
    navigateTo(url.pathname + url.search + url.hash)
  })

  window.addEventListener('popstate', () => {
    loadPage(window.location.pathname + window.location.search, false)
  })
}

function navigateTo(path) {
  if (window.location.pathname === path) return
  history.pushState(null, '', path)
  loadPage(path, true)
}

async function loadPage(path, scroll) {
  teardownMusicPage()

  try {
    const resp = await fetch(path)
    if (!resp.ok) throw new Error(resp.status)
    const html = await resp.text()

    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')

    const newMain = doc.querySelector('.main-content')
    const oldMain = document.querySelector('.main-content')
    if (newMain && oldMain) {
      oldMain.replaceWith(newMain)
    }

    const newTitle = doc.querySelector('title')
    if (newTitle) document.title = newTitle.textContent

    document.querySelectorAll('[data-page]').forEach((el) => el.classList.remove('active'))
    const pageKey = getPageKey()
    document.querySelectorAll(`.nav-link[data-page="${pageKey}"]`).forEach((el) => el.classList.add('active'))

    initPageTransition()
    initScrollReveal()
    swapPageCSS(pageKey)
    runPageInit(pageKey)

    window.scrollTo(0, 0)
  } catch {
    window.location.href = path
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initPageTransition()
  initNav()
  initScrollReveal()
  initMiniPlayer()
  interceptLinks()
  // No need to call swapPageCSS here — page CSS is already loaded via static <link> in HTML
  restoreState()
  runPageInit(getPageKey())
})
