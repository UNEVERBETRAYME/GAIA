/**
 * index.js - 首页专属脚本
 * 负责：向下引导箭头点击滚动、卡片交互
 */

// ========== 向下引导箭头：平滑滚动到板块区域 ==========
function initScrollArrow() {
  const arrow = document.getElementById('heroScrollArrow')
  const sections = document.getElementById('sections')
  if (!arrow || !sections) return

  arrow.addEventListener('click', () => {
    sections.scrollIntoView({ behavior: 'smooth' })
  })
}

// ========== 初始化 ==========
function initIndexPage() {
  initScrollArrow()
}

document.addEventListener('DOMContentLoaded', initIndexPage)
