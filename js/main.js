/**
 * main.js - 全站通用脚本入口
 * 负责：整合所有全局初始化逻辑
 * 包含：导航栏初始化、滚动触发动画、页面加载淡入
 *
 * 引入方式：Vite 支持 ES Module，通过 import 引入 nav.js 的导出函数
 * HTML 中以 <script type="module"> 引入本文件
 */

import { initNav } from './nav.js'

// ========== 页面加载淡入效果 ==========
// 给 <body> 添加 .page-enter（初始隐藏）
// 双 requestAnimationFrame 确保初始状态先渲染，再切换为 .page-enter-active 触发过渡
function initPageTransition() {
  document.body.classList.remove('page-loading')
  document.body.classList.add('page-enter')

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.body.classList.add('page-enter-active')
    })
  })
}

// ========== 滚动触发动画系统 ==========
// 使用 IntersectionObserver 观察所有 .scroll-reveal 元素
// 元素进入视口 15% 时添加 .revealed 类，单次触发后不再观察
function initScrollReveal() {
  const elements = document.querySelectorAll('.scroll-reveal')
  if (elements.length === 0) return

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed')
          // 单次触发：一旦 revealed 不再观察，避免反复触发
          observer.unobserve(entry.target)
        }
      })
    },
    {
      threshold: 0.15, // 元素进入视口 15% 时触发
    }
  )

  elements.forEach((el) => {
    observer.observe(el)
  })
}

// ========== 全局初始化 ==========
// 所有初始化在 DOMContentLoaded 中按顺序执行
document.addEventListener('DOMContentLoaded', () => {
  initPageTransition()
  initNav()
  initScrollReveal()
})
