const galleryData = [
  { game: '荒野大镖客：救赎 2', scene: '黄昏时分的瓦伦丁小镇', gradient: 'linear-gradient(135deg, #1a2a3a, #0d1520)' },
  { game: '赛博朋克 2077', scene: '夜之城的霓虹天际线', gradient: 'linear-gradient(135deg, #2d1f3d, #1a1225)' },
  { game: '塞尔达传说：旷野之息', scene: '海拉鲁平原的暴风雨之夜', gradient: 'linear-gradient(135deg, #1a3025, #0d1a15)' },
  { game: '最后生还者 Part II', scene: '西雅图废弃的书店', gradient: 'linear-gradient(135deg, #2a2a3d, #1a1a2e)' },
  { game: '死亡搁浅', scene: '荒原上的孤独行者', gradient: 'linear-gradient(135deg, #1e2a3a, #0f1923)' },
  { game: '艾尔登法环', scene: '黄金树下的交界地', gradient: 'linear-gradient(135deg, #25201a, #1a150f)' },
  { game: '对马岛之魂', scene: '金叶飘落的蒙古营地', gradient: 'linear-gradient(135deg, #1a2535, #0d1520)' },
  { game: '空洞骑士', scene: '泪水之城的幽暗雨夜', gradient: 'linear-gradient(135deg, #2d1f3d, #1a1225)' },
]

function initGalleryModal() {
  const modal = document.getElementById('galleryModal')
  const closeBtn = document.getElementById('galleryModalClose')
  const grid = document.getElementById('galleryGrid')
  if (!modal || !grid) return

  const modalImage = document.getElementById('galleryModalImage')
  const modalGame = document.getElementById('galleryModalGame')
  const modalScene = document.getElementById('galleryModalScene')

  grid.addEventListener('click', (e) => {
    const card = e.target.closest('.game-gallery-card')
    if (!card) return

    const index = parseInt(card.dataset.index, 10)
    const data = galleryData[index]
    if (!data) return

    modalImage.style.background = data.gradient
    modalGame.textContent = data.game
    modalScene.textContent = data.scene

    modal.classList.add('active')
    document.body.style.overflow = 'hidden'
  })

  function closeModal() {
    modal.classList.remove('active')
    document.body.style.overflow = ''
  }

  closeBtn.addEventListener('click', closeModal)
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal()
  })
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) closeModal()
  })
}

function initJournalExpand() {
  const journalSection = document.querySelector('.game-journal')
  if (!journalSection) return

  journalSection.addEventListener('click', (e) => {
    const btn = e.target.closest('.game-journal-card__expand-btn')
    if (!btn) return
    e.stopPropagation()

    const index = btn.dataset.journal
    const card = btn.closest('.game-journal-card')
    const fullEl = document.getElementById(`journalFull${index}`)

    if (!card || !fullEl) return

    const isExpanded = card.classList.contains('expanded')

    if (isExpanded) {
      card.classList.remove('expanded')
      fullEl.classList.remove('expanded')
      btn.textContent = '展开全文'
    } else {
      card.classList.add('expanded')
      fullEl.classList.add('expanded')
      btn.textContent = '收起'
    }
  })
}

function initDragScroll() {
  const track = document.getElementById('charactersTrack')
  if (!track) return

  let isDown = false
  let startX
  let scrollLeft

  track.addEventListener('mousedown', (e) => {
    isDown = true
    track.style.cursor = 'grabbing'
    startX = e.pageX - track.offsetLeft
    scrollLeft = track.scrollLeft
  })

  track.addEventListener('mouseleave', () => {
    isDown = false
    track.style.cursor = 'grab'
  })

  track.addEventListener('mouseup', () => {
    isDown = false
    track.style.cursor = 'grab'
  })

  track.addEventListener('mousemove', (e) => {
    if (!isDown) return
    e.preventDefault()
    const x = e.pageX - track.offsetLeft
    const walk = (x - startX) * 1.5
    track.scrollLeft = scrollLeft - walk
  })

  let touchStartX = 0
  let touchScrollLeft = 0

  track.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].pageX
    touchScrollLeft = track.scrollLeft
  }, { passive: true })

  track.addEventListener('touchmove', (e) => {
    const x = e.touches[0].pageX
    const walk = (touchStartX - x) * 1.2
    track.scrollLeft = touchScrollLeft + walk
  }, { passive: true })
}

export function initGameArtPage() {
  initGalleryModal()
  initJournalExpand()
  initDragScroll()
}
