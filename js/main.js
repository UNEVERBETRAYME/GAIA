import { initNav } from './nav.js'
import { restoreState } from './music-player.js'
import { initMiniPlayer } from './mini-player.js'

import { initIndexPage } from './pages/index.js'
import { initAIPage } from './pages/ai.js'
import { initMusicPage } from './pages/music.js'
import { initGameArtPage } from './pages/game-art.js'
import { initWordsPage } from './pages/words.js'
import { initKookPage } from './pages/kook.js'
import { initAboutPage } from './pages/about.js'
let footerResizeObserver = null
let observedFooter = null
let didWarmupPrefetch = false
const prefetchedPaths = new Set()

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

function initPageTransition() {
  document.body.classList.remove('page-loading')
  document.body.classList.add('page-enter')

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.body.classList.add('page-enter-active')
    })
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

function getPrefetchPath(link) {
  const href = link?.getAttribute('href')
  if (!href) return null

  try {
    const url = new URL(href, window.location.origin)
    if (url.origin !== window.location.origin) return null
    if (!url.pathname.endsWith('.html') && url.pathname !== '/' && url.pathname !== '/index.html') return null
    if ((url.pathname + url.search + url.hash) === (window.location.pathname + window.location.search + window.location.hash)) return null
    return url.pathname + url.search + url.hash
  } catch {
    return null
  }
}

function prefetchPage(path) {
  if (!path || prefetchedPaths.has(path)) return
  prefetchedPaths.add(path)

  const link = document.createElement('link')
  link.rel = 'prefetch'
  link.as = 'document'
  link.href = path
  document.head.appendChild(link)
}

function warmupPagePrefetch() {
  if (didWarmupPrefetch) return
  didWarmupPrefetch = true

  const paths = [...new Set(
    Array.from(document.querySelectorAll('.nav-link[href], .section-card[href], .footer__links a[href]'))
      .map((link) => getPrefetchPath(link))
      .filter(Boolean)
  )]

  if (paths.length === 0) return

  const runner = () => {
    paths.forEach((path, index) => {
      window.setTimeout(() => {
        prefetchPage(path)
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

function runPageInit(key) {
  const initFn = pageModules[key]
  if (initFn) initFn()
}

function initNativeNavigation() {
  document.addEventListener('mouseover', (e) => {
    const link = e.target.closest('a[href]')
    if (!link) return
    const path = getPrefetchPath(link)
    if (path) prefetchPage(path)
  }, { passive: true })

  document.addEventListener('focusin', (e) => {
    const link = e.target.closest?.('a[href]')
    if (!link) return
    const path = getPrefetchPath(link)
    if (path) prefetchPage(path)
  })

  document.addEventListener('touchstart', (e) => {
    const link = e.target.closest?.('a[href]')
    if (!link) return
    const path = getPrefetchPath(link)
    if (path) prefetchPage(path)
  }, { passive: true })

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]')
    if (!link) return
    if (link.target === '_blank' || link.hasAttribute('download')) return
    const path = getPrefetchPath(link)
    if (!path) return
    setPendingNav(path)
  })
}

document.addEventListener('DOMContentLoaded', () => {
  document.documentElement.dataset.page = getPageKey()

  initNav()
  initMiniPlayer()
  initNativeNavigation()

  let resizeTimer = null
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => {
      refreshFooterSpace()
    }, 140)
  }, { passive: true })

  refreshFooterSpace()
  initPageTransition()
  initScrollReveal()
  restoreState()
  runPageInit(getPageKey())
  refreshFooterSpace()
  warmupPagePrefetch()
})
