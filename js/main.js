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
const pageCssPromises = new Map()
const pageHtmlCache = new Map()
const pageFetchPromises = new Map()
let didWarmupPrefetch = false
let navigationRequestId = 0
let activeNavigationPath = ''

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
  if (pageCssPromises.has(key)) return pageCssPromises.get(key)

  const promise = new Promise((resolve) => {
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
    setTimeout(finish, 1200)

    document.head.appendChild(link)
  })

  pageCssPromises.set(key, promise)
  return promise
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

function canUseViewTransition() {
  return typeof document.startViewTransition === 'function' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function getCurrentLocationPath() {
  return window.location.pathname + window.location.search + window.location.hash
}

function syncNavState(pageKey) {
  document.querySelectorAll('[data-page]').forEach((el) => {
    el.classList.remove('active', 'pending')
  })
  document.querySelectorAll(`.nav-link[data-page="${pageKey}"]`).forEach((el) => {
    el.classList.add('active')
  })
}

function setPendingNav(path) {
  const pageKey = getPageKeyFromPath(path)
  document.querySelectorAll('[data-page]').forEach((el) => {
    el.classList.remove('pending')
  })
  document.querySelectorAll(`.nav-link[data-page="${pageKey}"]`).forEach((el) => {
    el.classList.add('pending')
  })
}

function clearPendingNav() {
  document.querySelectorAll('[data-page]').forEach((el) => {
    el.classList.remove('pending')
  })
}

function extractPagePayload(html) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const main = doc.querySelector('.main-content')
  const title = doc.querySelector('title')?.textContent || ''

  return {
    title,
    mainHtml: main ? main.outerHTML : '',
  }
}

function createMainFromHtml(mainHtml) {
  if (!mainHtml) return null
  const template = document.createElement('template')
  template.innerHTML = mainHtml.trim()
  return template.content.firstElementChild
}

function fetchPagePayload(path) {
  if (pageHtmlCache.has(path)) return Promise.resolve(pageHtmlCache.get(path))
  if (pageFetchPromises.has(path)) return pageFetchPromises.get(path)

  const promise = fetch(path)
    .then((resp) => {
      if (!resp.ok) throw new Error(resp.status)
      return resp.text()
    })
    .then((html) => {
      const payload = extractPagePayload(html)
      pageHtmlCache.set(path, payload)
      pageFetchPromises.delete(path)
      return payload
    })
    .catch((error) => {
      pageFetchPromises.delete(path)
      throw error
    })

  pageFetchPromises.set(path, promise)
  return promise
}

function prefetchPage(path) {
  const pageKey = getPageKeyFromPath(path)
  return Promise.all([
    loadPageCSS(pageKey),
    fetchPagePayload(path),
  ])
}

function warmupPagePrefetch() {
  if (didWarmupPrefetch) return
  didWarmupPrefetch = true

  const paths = [...new Set(
    Array.from(document.querySelectorAll('a[href]'))
      .map((link) => {
        const href = link.getAttribute('href')
        if (!href) return null
        try {
          const url = new URL(href, window.location.origin)
          if (url.origin !== window.location.origin) return null
          if (!url.pathname.endsWith('.html') && url.pathname !== '/') return null
          if (url.pathname === window.location.pathname) return null
          return url.pathname + url.search + url.hash
        } catch {
          return null
        }
      })
      .filter(Boolean)
  )]

  if (paths.length === 0) return

  const runner = () => {
    paths.forEach((path, index) => {
      window.setTimeout(() => {
        prefetchPage(path).catch(() => {})
      }, index * 120)
    })
  }

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(runner, { timeout: 900 })
  } else {
    window.setTimeout(runner, 280)
  }
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

function applyPagePayload({ pageKey, payload, nextStyle, scroll }) {
  const newMain = createMainFromHtml(payload?.mainHtml)
  const oldMain = document.querySelector('.main-content')
  if (newMain && oldMain) {
    oldMain.replaceWith(newMain)
  }

  commitPageCSS(nextStyle)

  if (payload?.title) document.title = payload.title
  document.documentElement.dataset.page = pageKey
  syncNavState(pageKey)

  if (scroll) window.scrollTo(0, 0)

  document.body.classList.remove('page-enter', 'page-enter-active')
  initPageTransition()
  initScrollReveal()
  runPageInit(pageKey)
  refreshFooterSpace()
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
  function getPrefetchPath(link) {
    const href = link?.getAttribute('href')
    if (!href) return null

    try {
      const url = new URL(href, window.location.origin)
      if (url.origin !== window.location.origin) return null
      if (!url.pathname.endsWith('.html') && url.pathname !== '/') return null
      if (url.pathname === window.location.pathname) return null
      return url.pathname + url.search + url.hash
    } catch {
      return null
    }
  }

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

  document.addEventListener('mouseover', (e) => {
    const link = e.target.closest('a[href]')
    if (!link) return
    const path = getPrefetchPath(link)
    if (path) prefetchPage(path).catch(() => {})
  }, { passive: true })

  document.addEventListener('focusin', (e) => {
    const link = e.target.closest?.('a[href]')
    if (!link) return
    const path = getPrefetchPath(link)
    if (path) prefetchPage(path).catch(() => {})
  })

  document.addEventListener('touchstart', (e) => {
    const link = e.target.closest?.('a[href]')
    if (!link) return
    const path = getPrefetchPath(link)
    if (path) prefetchPage(path).catch(() => {})
  }, { passive: true })
}

function navigateTo(path) {
  if (getCurrentLocationPath() === path || activeNavigationPath === path) return
  setPendingNav(path)
  history.pushState(null, '', path)
  loadPage(path, true)
}

async function loadPage(path, scroll) {
  const requestId = ++navigationRequestId
  activeNavigationPath = path

  try {
    const pageKey = getPageKeyFromPath(path)
    const [nextStyle, payload] = await prefetchPage(path)

    if (requestId !== navigationRequestId) return

    const leavingMusic = currentPageKey === 'music' && pageKey !== 'music'
    if (leavingMusic) {
      teardownMusicPage()
    }

    if (canUseViewTransition()) {
      document.body.classList.add('page-transition-native')
      const transition = document.startViewTransition(() => {
        applyPagePayload({ pageKey, payload, nextStyle, scroll })
      })
      transition.finished.catch(() => {}).finally(() => {
        if (requestId === navigationRequestId) {
          document.body.classList.remove('page-transition-native')
          clearPendingNav()
          activeNavigationPath = ''
        }
      })
    } else {
      document.body.classList.add('page-switching')
      applyPagePayload({ pageKey, payload, nextStyle, scroll })
      requestAnimationFrame(() => {
        document.body.classList.remove('page-switching')
        if (requestId === navigationRequestId) {
          clearPendingNav()
          activeNavigationPath = ''
        }
      })
    }
  } catch {
    document.body.classList.remove('page-switching', 'page-transition-native')
    clearPendingNav()
    activeNavigationPath = ''
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
    warmupPagePrefetch()
  })
})
