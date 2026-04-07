/**
 * nav.js - 全站导航栏逻辑
 * 负责：当前页面高亮、汉堡菜单、移动端全屏菜单、滚动增强、body scroll lock
 */

// ========== 当前页面高亮 ==========
// 根据 URL 自动为对应 .nav-link 添加 .active 类
function highlightCurrentPage() {
  const currentPath = window.location.pathname
  const navLinks = document.querySelectorAll('.nav-link')

  navLinks.forEach((link) => {
    const href = link.getAttribute('href')
    if (!href) return

    // 规范化路径：去除尾部斜杠，统一小写
    const normalizedCurrent = currentPath.replace(/\/+$/, '').toLowerCase()
    const normalizedHref = href.replace(/\/+$/, '').toLowerCase()

    // 精确匹配或以 href 结尾匹配
    if (
      normalizedCurrent === normalizedHref ||
      normalizedCurrent.endsWith(normalizedHref)
    ) {
      link.classList.add('active')
    } else {
      link.classList.remove('active')
    }
  })
}

// ========== 汉堡按钮 + 移动端菜单 ==========
function initMobileMenu() {
  const hamburger = document.getElementById('navHamburger')
  const mobileMenu = document.getElementById('mobileMenu')
  const closeBtn = document.getElementById('mobileMenuClose')
  if (!hamburger || !mobileMenu) return

  // 打开菜单
  function openMenu() {
    hamburger.classList.add('active')
    mobileMenu.classList.add('active')
    document.body.style.overflow = 'hidden'
  }

  // 关闭菜单
  function closeMenu() {
    hamburger.classList.remove('active')
    mobileMenu.classList.remove('active')
    document.body.style.overflow = ''
  }

  // 汉堡按钮点击
  hamburger.addEventListener('click', () => {
    if (mobileMenu.classList.contains('active')) {
      closeMenu()
    } else {
      openMenu()
    }
  })

  // 关闭按钮点击
  if (closeBtn) {
    closeBtn.addEventListener('click', closeMenu)
  }

  // 点击菜单内链接后自动关闭
  const mobileLinks = mobileMenu.querySelectorAll('.mobile-menu__link')
  mobileLinks.forEach((link) => {
    link.addEventListener('click', closeMenu)
  })

  // ESC 键关闭菜单
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
      closeMenu()
    }
  })
}

// ========== 滚动增强 ==========
// 滚动 > 30px 时加深导航栏背景
function initNavScroll() {
  const nav = document.getElementById('mainNav')
  if (!nav) return

  let ticking = false

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        if (window.scrollY > 30) {
          nav.classList.add('scrolled')
        } else {
          nav.classList.remove('scrolled')
        }
        ticking = false
      })
      ticking = true
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true })
}

// ========== 初始化 ==========
function initNav() {
  highlightCurrentPage()
  initMobileMenu()
  initNavScroll()
}

export { initNav }
