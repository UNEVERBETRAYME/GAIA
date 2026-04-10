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

import indexPageCssUrl from '../css/pages/index.css?url'
import aiPageCssUrl from '../css/pages/ai.css?url'
import musicPageCssUrl from '../css/pages/music.css?url'
import gameArtPageCssUrl from '../css/pages/game-art.css?url'
import wordsPageCssUrl from '../css/pages/words.css?url'
import kookPageCssUrl from '../css/pages/kook.css?url'
import aboutPageCssUrl from '../css/pages/about.css?url'

const PAGE_CSS_MAP = {
  'index': indexPageCssUrl,
  'ai': aiPageCssUrl,
  'music': musicPageCssUrl,
  'game-art': gameArtPageCssUrl,
  'words': wordsPageCssUrl,
  'kook': kookPageCssUrl,
  'about': aboutPageCssUrl,
}

let currentStyleEl = null
let pendingStyleEl = null
let footerResizeObserver = null
let observedFooter = null

function syncFooterSpace() {
  const footer = document.querySelector('.footer')
  if (!footer) return

  const h = Math.ceil(footer.getBoundingClientRect().height)
  document.documentElement.style.setProperty('--footer-space', `${h}px`)
}

function ensureFooterObserver() {
  const footer = document.querySelector('.footer')
  if (!footer) return

  if (typeof ResizeObserver !== 'undefined') {
    if (!footerResizeObserver) {
      footerResizeObserver = new ResizeObserver(() => {
        syncFooterSpace()
      })
    }

    if (observedFooter !== footer) {
      if (observedFooter) {
        footerResizeObserver.unobserve(observedFooter)
      }
      observedFooter = footer
      footerResizeObserver.observe(footer)
    }
  }
}

function refreshFooterSpace() {
  syncFooterSpace()
  ensureFooterObserver()
}

function loadPageCSS(key) {
  return new Promise((resolve) => {
    const href = PAGE_CSS_MAP[key]
    if (!href) { resolve(null); return }

    const existing = document.querySelector(`link[data-page-style="${key}"]`)
    if (existing) {
      pendingStyleEl = existing
      resolve(existing)
      return
    }

    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = href
    link.dataset.pageStyle = key
    link.disabled = true

    let settled = false
    function finish() {
      if (settled) return
      settled = true
      pendingStyleEl = link
      resolve(link)
    }

    link.onload = finish
    link.onerror = finish
    setTimeout(finish, 3000)

    document.head.appendChild(link)
  })
}

function commitPageCSS(link) {
  if (!link) return
  link.disabled = false
  if (currentStyleEl && currentStyleEl !== link) {
    currentStyleEl.remove()
  }
  currentStyleEl = link
  pendingStyleEl = null
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

function getPageKeyFromPath(p) {
  if (p === '/' || p.endsWith('/index.html')) return 'index'
  const m = p.match(/\/pages\/([^.]+)\.html/)
  return m ? m[1] : 'index'
}

function getPageKey() {
  return getPageKeyFromPath(window.location.pathname)
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
    const pageKey = getPageKeyFromPath(path)
    document.body.classList.add('page-switching')

    const cssPromise = loadPageCSS(pageKey)
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

    const nextStyle = await cssPromise
    commitPageCSS(nextStyle)

    const newTitle = doc.querySelector('title')
    if (newTitle) document.title = newTitle.textContent

    document.querySelectorAll('[data-page]').forEach((el) => el.classList.remove('active'))
    document.querySelectorAll(`.nav-link[data-page="${pageKey}"]`).forEach((el) => el.classList.add('active'))

    document.documentElement.dataset.page = pageKey
    document.body.classList.remove('page-enter', 'page-enter-active')
    initPageTransition()
    initScrollReveal()
    runPageInit(pageKey)
    refreshFooterSpace()

    requestAnimationFrame(() => {
      document.body.classList.remove('page-switching')
    })

    if (scroll) window.scrollTo(0, 0)
  } catch {
    document.body.classList.remove('page-switching')
    window.location.href = path
  }
}

const initialPageCssPromise = loadPageCSS(getPageKey())

document.addEventListener('DOMContentLoaded', () => {
  document.documentElement.dataset.page = getPageKey()

  initNav()
  initMiniPlayer()
  interceptLinks()

  let resizeTimer = null
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => {
      refreshFooterSpace()
    }, 140)
  }, { passive: true })

  refreshFooterSpace()

  initialPageCssPromise.then((link) => {
    commitPageCSS(link)
    initPageTransition()
    initScrollReveal()
    restoreState()
    runPageInit(getPageKey())
    refreshFooterSpace()
  })
})
