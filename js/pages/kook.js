function initJoinButtons() {
  const joinBtns = document.querySelectorAll('.kook-hero__btn, .kook-cta__btn')
  joinBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      if (btn.getAttribute('href') === '#KOOK_INVITE_LINK') {
        e.preventDefault()
        console.log('请将 href="#KOOK_INVITE_LINK" 替换为真实的 Kook 邀请链接')
      }
    })
  })
}

function initChannelCards() {
  const channelsGrid = document.querySelector('.kook-channels-grid')
  if (!channelsGrid) return

  channelsGrid.addEventListener('click', (e) => {
    const card = e.target.closest('.kook-channel-card')
    if (!card) return
    card.style.transform = 'scale(0.97)'
    setTimeout(() => { card.style.transform = '' }, 150)
  })
}

export function initKookPage() {
  initJoinButtons()
  initChannelCards()
}
