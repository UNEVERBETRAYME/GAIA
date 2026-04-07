/**
 * kook.js - 社区落地页专属脚本
 * 负责：加入按钮点击处理（链接占位提示）、频道卡片微交互
 */

// ============================================================
// 加入按钮：占位链接提示
// ============================================================

function initJoinButtons() {
  const joinBtns = document.querySelectorAll('.kook-hero__btn, .kook-cta__btn')

  joinBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      // 如果仍然是占位链接，提示替换
      if (btn.getAttribute('href') === '#KOOK_INVITE_LINK') {
        e.preventDefault()
        // 此处可替换为实际的 Kook 邀请链接跳转
        console.log('请将 href="#KOOK_INVITE_LINK" 替换为真实的 Kook 邀请链接')
      }
    })
  })
}

// ============================================================
// 频道卡片：点击反馈（事件委托）
// ============================================================

function initChannelCards() {
  const channelsGrid = document.querySelector('.kook-channels-grid')
  if (!channelsGrid) return

  channelsGrid.addEventListener('click', (e) => {
    const card = e.target.closest('.kook-channel-card')
    if (!card) return

    // 轻微的点击缩放反馈
    card.style.transform = 'scale(0.97)'
    setTimeout(() => {
      card.style.transform = ''
    }, 150)
  })
}

// ============================================================
// 初始化
// ============================================================

function initKookPage() {
  initJoinButtons()
  initChannelCards()
}

document.addEventListener('DOMContentLoaded', initKookPage)
