function initScrollArrow() {
  const arrow = document.getElementById('heroScrollArrow')
  const sections = document.getElementById('sections')
  if (!arrow || !sections) return

  arrow.addEventListener('click', () => {
    sections.scrollIntoView({ behavior: 'smooth' })
  })
}

export function initIndexPage() {
  initScrollArrow()
}
