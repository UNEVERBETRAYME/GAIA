const SERIES_DATA = [
  {
    key: 'coast-night',
    title: '深夜海岸',
    desc: '雾、潮声与低频的光，适合把心事放远。',
  },
  {
    key: 'city-soliloquy',
    title: '城市独白',
    desc: '霓虹与人群的背面，写给独行者的旁白。',
  },
  {
    key: 'time-fluid',
    title: '时间的形状',
    desc: '让抽象替你说话，时间在暗处缓慢流动。',
  },
]

const aigcData = [
  {
    id: 'aigc-0',
    title: '雾中灯塔',
    desc: '深夜海边的孤独灯塔，被浓雾环绕。远处的光束穿透雾气，在海面上投下长长的光路。',
    summary: '深夜海边的孤独灯塔，被浓雾环绕',
    category: 'painting',
    series: 'coast-night',
    gradient: 'linear-gradient(135deg, #2a2a3d, #1a1a2e)',
    prompt: 'A solitary lighthouse on a dark cliff, surrounded by thick fog, beam of light cutting through the mist, reflection on calm ocean surface, cinematic lighting, photorealistic, 8k --ar 3:4 --v 6',
    model: 'Midjourney v6',
    tags: ['Midjourney', '写实风', '夜景'],
  },
  {
    id: 'aigc-1',
    title: '城市独白',
    desc: '用 AI 生成的都市情感短文系列，捕捉城市生活中那些细微的情绪波动。',
    summary: '用 AI 生成的都市情感短文系列',
    category: 'copywriting',
    series: 'city-soliloquy',
    gradient: 'linear-gradient(135deg, #1e2a3a, #0f1923)',
    prompt: '写一篇关于深夜独自走在城市街道上的散文，300字左右，风格要带有淡淡的忧伤和对生活的思考，不要太矫情，像一个人在和自己对话。',
    model: 'Claude 3.5 Sonnet',
    tags: ['Claude', '散文', '情感'],
  },
  {
    id: 'aigc-2',
    title: '赛博雨巷',
    desc: '霓虹灯下的雨夜小巷，赛博朋克风格。湿漉漉的地面反射着五彩的霓虹光。',
    summary: '霓虹灯下的雨夜小巷，赛博朋克风格',
    category: 'painting',
    series: 'city-soliloquy',
    gradient: 'linear-gradient(135deg, #2d1f3d, #1a1225)',
    prompt: 'A narrow alley in a cyberpunk city at night, rain-soaked ground reflecting neon lights, Chinese and Japanese signage, moody atmosphere, volumetric fog, blade runner aesthetic --ar 3:4 --v 6',
    model: 'Stable Diffusion XL',
    tags: ['Stable Diffusion', '赛博朋克', '雨景'],
  },
  {
    id: 'aigc-3',
    title: '午夜钢琴曲',
    desc: 'AI 生成的氛围钢琴旋律，适合深夜聆听。简单的几个音符，却能触动心底最柔软的地方。',
    summary: 'AI 生成的氛围钢琴旋律，适合深夜聆听',
    category: 'music',
    series: 'coast-night',
    gradient: 'linear-gradient(135deg, #1a2530, #0d1520)',
    prompt: 'A melancholic solo piano piece, slow tempo, ambient atmosphere, late night mood, minimalistic melody with emotional depth, inspired by Ryuichi Sakamoto and Nils Frahm',
    model: 'Suno v3.5',
    tags: ['Suno', '氛围音乐', '钢琴'],
  },
  {
    id: 'aigc-4',
    title: '时间的形状',
    desc: '抽象流体动画，探索时间与空间的视觉隐喻。色彩在画布上自由流动、融合、消散。',
    summary: '抽象流体动画，探索时间与空间的视觉隐喻',
    category: 'video',
    series: 'time-fluid',
    gradient: 'linear-gradient(135deg, #25201a, #1a150f)',
    prompt: 'Abstract fluid animation, slow morphing shapes in dark muted tones, ink dissolving in water effect, seamless loop, 4k, cinematic color grading',
    model: 'Runway Gen-3',
    tags: ['Runway', '抽象动画', '流体'],
  },
]

const toolsData = [
  {
    name: 'Midjourney',
    desc: '顶级 AI 图像生成工具，以艺术风格和高质量输出著称。通过 Discord 使用，支持丰富的参数调整。',
    tags: ['图像生成', '艺术创作'],
    fullDesc: 'Midjourney 是目前最强大的 AI 图像生成工具之一，擅长生成具有艺术感的高质量图像。通过 Discord 机器人交互，支持风格化、画面比例、种子值等多种参数调整。',
    steps: [
      '加入 Midjourney 官方 Discord 服务器',
      '在任意新手频道中输入 /imagine 命令',
      '在 prompt 中描述你想要的画面',
      '等待约 60 秒，AI 会生成 4 张候选图',
      '使用 U1-U4 放大对应图片，V1-V4 生成变体',
    ],
    link: 'https://www.midjourney.com',
  },
  {
    name: 'Claude',
    desc: 'Anthropic 开发的 AI 助手，擅长长文本创作与深度对话。理解力强，回复质量高。',
    tags: ['文案助手', '对话 AI'],
    fullDesc: 'Claude 是由 Anthropic 公司开发的 AI 助手，以出色的文本理解与生成能力著称。支持长上下文对话，在创意写作、代码编写、分析推理等方面表现优异。',
    steps: [
      '访问 claude.ai 注册账号',
      '在对话框中输入你的问题或需求',
      '可以上传文件进行分析',
      '使用 Projects 功能管理长期项目',
      '通过 Artifacts 查看生成的代码或文档',
    ],
    link: 'https://claude.ai',
  },
  {
    name: 'Suno',
    desc: 'AI 音乐生成平台，输入文字描述即可创作完整歌曲。支持多种音乐风格和语言。',
    tags: ['音乐生成', 'AI 作曲'],
    fullDesc: 'Suno 是一款革命性的 AI 音乐生成工具，只需输入文字描述，就能生成包含人声、乐器和编曲的完整歌曲。支持流行、摇滚、电子、古典等多种风格。',
    steps: [
      '访问 suno.com 注册账号',
      '点击 "Create" 进入创作页面',
      '在描述框中输入歌曲风格和主题',
      '可选：自定义歌词或让 AI 生成',
      '点击生成，约 30 秒后获得完整歌曲',
    ],
    link: 'https://suno.com',
  },
]

const STORAGE_KEYS = {
  favorites: 'gaia_ai_favorites',
  recent: 'gaia_ai_recent',
  view: 'gaia_ai_view',
  filter: 'gaia_ai_filter',
  series: 'gaia_ai_series',
}

const ICONS = {
  heart: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-4.4-9.4-8.4C.6 9.2 2.5 6 6 6c1.8 0 3.2.9 4 2 0.8-1.1 2.2-2 4-2 3.5 0 5.4 3.2 3.4 6.6C19 16.6 12 21 12 21z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`,
}

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function readList(key) {
  const raw = localStorage.getItem(key)
  const value = safeJsonParse(raw, [])
  return Array.isArray(value) ? value : []
}

function writeList(key, list) {
  localStorage.setItem(key, JSON.stringify(list))
}

function uniqueUnshift(list, item) {
  const next = list.filter((v) => v !== item)
  next.unshift(item)
  return next
}

function copyText(text) {
  if (!text) return Promise.resolve(false)
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text).then(() => true).catch(() => false)
  }

  try {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    document.body.appendChild(textarea)
    textarea.select()
    const ok = document.execCommand('copy')
    textarea.remove()
    return Promise.resolve(!!ok)
  } catch {
    return Promise.resolve(false)
  }
}

function flashButton(btn, text) {
  if (!btn) return
  const prev = btn.textContent
  btn.textContent = text
  btn.disabled = true
  window.setTimeout(() => {
    btn.textContent = prev
    btn.disabled = false
  }, 900)
}

function getSeriesMeta(seriesKey) {
  return SERIES_DATA.find((s) => s.key === seriesKey) || null
}

function renderAigcCard(data, index) {
  const card = document.createElement('div')
  card.className = 'glass-card ai-card'
  card.dataset.category = data.category
  card.dataset.index = String(index)
  card.dataset.id = data.id
  card.dataset.series = data.series

  const seriesMeta = getSeriesMeta(data.series)
  const allTags = [...data.tags]
  if (seriesMeta && !allTags.includes(seriesMeta.title)) allTags.unshift(seriesMeta.title)

  const tagsHtml = allTags.map((t) => `<span class="glass-tag">${t}</span>`).join('')

  card.innerHTML = `
    <button class="ai-card__fav" type="button" aria-label="收藏">${ICONS.heart}</button>
    <div class="ai-card__image" style="background: ${data.gradient}"></div>
    <h3 class="ai-card__title">${data.title}</h3>
    <p class="ai-card__desc">${data.summary || data.desc}</p>
    <div class="ai-card__tags">${tagsHtml}</div>
  `

  return card
}

function renderAigcGallery() {
  const gallery = document.getElementById('aigcGallery')
  if (!gallery) return
  gallery.innerHTML = ''

  const frag = document.createDocumentFragment()
  aigcData.forEach((data, index) => {
    frag.appendChild(renderAigcCard(data, index))
  })
  gallery.appendChild(frag)
}

function renderSeriesView() {
  const el = document.getElementById('seriesView')
  if (!el) return
  el.innerHTML = ''

  const frag = document.createDocumentFragment()

  SERIES_DATA.forEach((series) => {
    const items = aigcData.filter((x) => x.series === series.key)
    if (items.length === 0) return

    const wrap = document.createElement('div')
    wrap.className = 'ai-series glass-card'
    wrap.dataset.series = series.key

    const grid = document.createElement('div')
    grid.className = 'ai-series__grid'
    items.forEach((item) => grid.appendChild(renderAigcCard(item, aigcData.findIndex((x) => x.id === item.id))))

    wrap.innerHTML = `
      <div class="ai-series__head">
        <div class="ai-series__text">
          <h3 class="ai-series__title">${series.title}</h3>
          <p class="ai-series__desc">${series.desc}</p>
        </div>
        <div class="ai-series__actions">
          <button class="glass-btn ai-series__open" type="button" data-series="${series.key}">进入系列</button>
        </div>
      </div>
    `
    wrap.appendChild(grid)
    frag.appendChild(wrap)
  })

  el.appendChild(frag)
}

function parsePrompt(prompt) {
  const raw = (prompt || '').trim()
  const params = raw.match(/--[a-zA-Z0-9:_-]+(?:\s+[^\s,，]+)?/g) || []
  let main = raw
  params.forEach((p) => { main = main.replace(p, '') })
  main = main.replace(/\s{2,}/g, ' ').trim()

  const parts = main.includes(',') ? main.split(',') : (main.includes('，') ? main.split('，') : [main])
  const cleaned = parts.map((p) => p.trim()).filter(Boolean)

  const groups = {
    subject: [],
    scene: [],
    lighting: [],
    camera: [],
    style: [],
    params: [...new Set(params.map((p) => p.trim()).filter(Boolean))],
  }

  if (cleaned.length === 0) return groups
  groups.subject.push(cleaned[0])

  const lightingKeys = ['lighting', 'light', 'cinematic', 'volumetric', 'glow', 'shadow', 'rim light', 'color grading', 'moody']
  const cameraKeys = ['lens', 'camera', 'depth of field', 'bokeh', 'close-up', 'wide', 'angle', 'shot', 'focus']
  const styleKeys = ['photorealistic', 'realistic', '8k', '4k', 'ultra', 'high detail', 'blade runner', 'aesthetic', 'style', 'render', 'illustration', 'anime']
  const sceneKeys = ['city', 'alley', 'ocean', 'sea', 'rain', 'fog', 'mist', 'cliff', 'night', 'street', 'neon', 'signage', 'water']

  const rest = cleaned.slice(1)
  rest.forEach((seg) => {
    const s = seg.toLowerCase()
    if (lightingKeys.some((k) => s.includes(k))) {
      groups.lighting.push(seg)
      return
    }
    if (cameraKeys.some((k) => s.includes(k))) {
      groups.camera.push(seg)
      return
    }
    if (styleKeys.some((k) => s.includes(k))) {
      groups.style.push(seg)
      return
    }
    if (sceneKeys.some((k) => s.includes(k))) {
      groups.scene.push(seg)
      return
    }
    groups.scene.push(seg)
  })

  return groups
}

function renderPromptStruct(prompt, container) {
  if (!container) return
  container.innerHTML = ''

  const groups = parsePrompt(prompt)
  const order = [
    ['subject', '主体'],
    ['scene', '环境'],
    ['lighting', '光影'],
    ['camera', '镜头'],
    ['style', '风格'],
    ['params', '参数'],
  ]

  const frag = document.createDocumentFragment()
  order.forEach(([key, label]) => {
    const items = groups[key] || []
    if (!items.length) return

    const group = document.createElement('div')
    const tags = items.map((t) => `<button class="glass-tag ai-tag-btn" type="button" data-copy="${encodeURIComponent(t)}">${t}</button>`).join('')
    group.innerHTML = `
      <span class="ai-prompt-group__label">${label}</span>
      <div class="ai-prompt-group__tags">${tags}</div>
    `
    frag.appendChild(group)
  })

  container.appendChild(frag)
}

function getStateFromStorage() {
  const view = localStorage.getItem(STORAGE_KEYS.view) || 'cards'
  const filter = localStorage.getItem(STORAGE_KEYS.filter) || 'all'
  const series = localStorage.getItem(STORAGE_KEYS.series) || ''
  return {
    view: view === 'series' ? 'series' : 'cards',
    filter,
    series: series || null,
  }
}

function setStateToStorage(state) {
  localStorage.setItem(STORAGE_KEYS.view, state.view)
  localStorage.setItem(STORAGE_KEYS.filter, state.filter)
  localStorage.setItem(STORAGE_KEYS.series, state.series || '')
}

function syncFavoriteClasses(favoritesSet) {
  document.querySelectorAll('.ai-card').forEach((card) => {
    const id = card.dataset.id
    card.classList.toggle('is-favorited', !!id && favoritesSet.has(id))
  })
}

function applyAigcFilter(state, favoritesSet, recentSet) {
  const cards = document.querySelectorAll('#aigcGallery .ai-card')
  let visible = 0

  cards.forEach((card) => {
    const id = card.dataset.id
    const category = card.dataset.category
    const series = card.dataset.series

    let show = true
    if (state.series) show = show && series === state.series

    if (state.filter === 'favorites') {
      show = show && favoritesSet.has(id)
    } else if (state.filter === 'recent') {
      show = show && recentSet.has(id)
    } else if (state.filter !== 'all') {
      show = show && category === state.filter
    }

    card.style.display = show ? '' : 'none'
    if (show) visible += 1
  })

  const empty = document.getElementById('aigcEmpty')
  if (empty) empty.hidden = visible !== 0
}

function applyView(state) {
  const gallery = document.getElementById('aigcGallery')
  const empty = document.getElementById('aigcEmpty')
  const series = document.getElementById('seriesView')
  if (!gallery || !series) return

  const isCards = state.view === 'cards'
  gallery.hidden = !isCards
  if (empty) empty.hidden = !isCards || empty.hidden
  series.hidden = isCards
}

function syncControls(state) {
  document.querySelectorAll('.ai-filter__tag').forEach((tag) => {
    tag.classList.toggle('active', tag.dataset.filter === state.filter)
  })
  document.querySelectorAll('.ai-view-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.view === state.view)
  })
}

function syncSeriesBar(state) {
  const bar = document.getElementById('seriesBar')
  const name = document.getElementById('seriesBarName')
  if (!bar || !name) return

  if (!state.series) {
    bar.hidden = true
    return
  }

  const meta = getSeriesMeta(state.series)
  name.textContent = meta ? meta.title : state.series
  bar.hidden = false
}

function initAigcUI() {
  if (window.__gaiaAiCleanup) {
    window.__gaiaAiCleanup()
    window.__gaiaAiCleanup = null
  }

  renderAigcGallery()
  renderSeriesView()

  let state = getStateFromStorage()

  const favorites = readList(STORAGE_KEYS.favorites)
  const recent = readList(STORAGE_KEYS.recent)
  let favoritesSet = new Set(favorites)
  let recentSet = new Set(recent)

  function recompute() {
    syncFavoriteClasses(favoritesSet)
    syncControls(state)
    syncSeriesBar(state)
    applyView(state)
    if (state.view === 'cards') applyAigcFilter(state, favoritesSet, recentSet)
    setStateToStorage(state)
  }

  const seriesClearBtn = document.getElementById('seriesBarClear')
  if (seriesClearBtn) {
    seriesClearBtn.addEventListener('click', () => {
      state.series = null
      recompute()
    })
  }

  document.querySelectorAll('.ai-filter__tag').forEach((tag) => {
    tag.addEventListener('click', () => {
      state.filter = tag.dataset.filter || 'all'
      if (state.view !== 'cards') state.view = 'cards'
      recompute()
    })
  })

  document.querySelectorAll('.ai-view-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.view = btn.dataset.view === 'series' ? 'series' : 'cards'
      recompute()
    })
  })

  const modal = document.getElementById('aigcModal')
  const closeBtn = document.getElementById('aigcModalClose')
  const modalImage = document.getElementById('modalImage')
  const modalTitle = document.getElementById('modalTitle')
  const modalDesc = document.getElementById('modalDesc')
  const modalPromptCode = document.getElementById('modalPromptCode')
  const modalMeta = document.getElementById('modalMeta')
  const copyPromptBtn = document.getElementById('copyPromptBtn')
  const modalPromptStruct = document.getElementById('modalPromptStruct')

  let currentModalId = null
  let currentPrompt = ''

  function closeModal() {
    if (!modal) return
    modal.classList.remove('active')
    document.body.style.overflow = ''
    currentModalId = null
    currentPrompt = ''
  }

  function openModalByIndex(index) {
    const data = aigcData[index]
    if (!data || !modal) return

    currentModalId = data.id
    currentPrompt = data.prompt || ''

    if (modalImage) modalImage.style.background = data.gradient
    if (modalTitle) modalTitle.textContent = data.title
    if (modalDesc) modalDesc.textContent = data.desc
    if (modalPromptCode) modalPromptCode.textContent = data.prompt
    renderPromptStruct(data.prompt, modalPromptStruct)

    if (modalMeta) {
      modalMeta.innerHTML = ''

      const seriesMeta = getSeriesMeta(data.series)
      if (seriesMeta) {
        const seriesBtn = document.createElement('button')
        seriesBtn.className = 'glass-tag ai-tag-btn'
        seriesBtn.type = 'button'
        seriesBtn.textContent = `系列：${seriesMeta.title}`
        seriesBtn.addEventListener('click', () => {
          state.view = 'cards'
          state.series = data.series
          state.filter = 'all'
          closeModal()
          recompute()
          document.getElementById('panelAigc')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        })
        modalMeta.appendChild(seriesBtn)
      }

      const favBtn = document.createElement('button')
      favBtn.className = 'glass-tag ai-tag-btn'
      favBtn.type = 'button'
      favBtn.textContent = favoritesSet.has(data.id) ? '已收藏' : '收藏'
      favBtn.addEventListener('click', () => {
        if (favoritesSet.has(data.id)) {
          favoritesSet.delete(data.id)
        } else {
          favoritesSet.add(data.id)
        }
        writeList(STORAGE_KEYS.favorites, Array.from(favoritesSet))
        favBtn.textContent = favoritesSet.has(data.id) ? '已收藏' : '收藏'
        recompute()
      })
      modalMeta.appendChild(favBtn)

      const modelTag = document.createElement('span')
      modelTag.className = 'glass-tag'
      modelTag.textContent = data.model
      modalMeta.appendChild(modelTag)

      data.tags.forEach((tagText) => {
        const tag = document.createElement('span')
        tag.className = 'glass-tag'
        tag.textContent = tagText
        modalMeta.appendChild(tag)
      })
    }

    recentSet = new Set(uniqueUnshift(Array.from(recentSet), data.id).slice(0, 12))
    writeList(STORAGE_KEYS.recent, Array.from(recentSet))

    modal.classList.add('active')
    document.body.style.overflow = 'hidden'
    recompute()
  }

  if (closeBtn) closeBtn.addEventListener('click', closeModal)
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal()
    })
  }
  function onKeyDown(e) {
    if (e.key === 'Escape' && modal?.classList.contains('active')) closeModal()
  }

  function onCopyPrompt() {
    copyText(currentPrompt).then((ok) => {
      flashButton(copyPromptBtn, ok ? '已复制' : '复制失败')
    })
  }

  function onDocClick(e) {
    const seriesBtn = e.target.closest('.ai-series__open')
    if (seriesBtn) {
      const key = seriesBtn.dataset.series
      if (key) {
        state.view = 'cards'
        state.series = key
        state.filter = 'all'
        recompute()
        document.getElementById('panelAigc')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
      return
    }

    const partBtn = e.target.closest('.ai-tag-btn[data-copy]')
    if (partBtn && modal?.classList.contains('active')) {
      const encoded = partBtn.dataset.copy
      const value = encoded ? decodeURIComponent(encoded) : ''
      copyText(value).then((ok) => {
        if (ok) partBtn.textContent = '已复制'
        window.setTimeout(() => {
          partBtn.textContent = value
        }, 700)
      })
      return
    }

    const fav = e.target.closest('.ai-card__fav')
    if (fav) {
      e.preventDefault()
      const card = fav.closest('.ai-card')
      const id = card?.dataset.id
      if (!id) return
      if (favoritesSet.has(id)) {
        favoritesSet.delete(id)
      } else {
        favoritesSet.add(id)
      }
      writeList(STORAGE_KEYS.favorites, Array.from(favoritesSet))
      recompute()
      return
    }

    const card = e.target.closest('.ai-card')
    if (!card) return
    if (!document.getElementById('panelAigc')?.contains(card)) return

    const idx = parseInt(card.dataset.index, 10)
    if (Number.isFinite(idx)) openModalByIndex(idx)
  }

  if (copyPromptBtn) copyPromptBtn.addEventListener('click', onCopyPrompt)
  document.addEventListener('keydown', onKeyDown)
  document.addEventListener('click', onDocClick)

  window.__gaiaAiCleanup = () => {
    if (copyPromptBtn) copyPromptBtn.removeEventListener('click', onCopyPrompt)
    document.removeEventListener('keydown', onKeyDown)
    document.removeEventListener('click', onDocClick)
  }

  recompute()
}

function initTabs() {
  const tabs = document.querySelectorAll('.ai-tab')
  const panels = document.querySelectorAll('.ai-panel')

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab
      tabs.forEach((t) => t.classList.remove('active'))
      tab.classList.add('active')

      panels.forEach((panel) => {
        panel.classList.remove('active')
        if (panel.id === `panel${target.charAt(0).toUpperCase() + target.slice(1)}`) {
          panel.classList.add('active')
        }
      })
    })
  })
}

function initFilter() {}

function initAigcModal() {}

function initToolModal() {
  const modal = document.getElementById('toolModal')
  const closeBtn = document.getElementById('toolModalClose')
  const detailBtns = document.querySelectorAll('.ai-tool-detail-btn')
  if (!modal) return

  const toolModalTitle = document.getElementById('toolModalTitle')
  const toolModalDesc = document.getElementById('toolModalDesc')
  const toolModalLink = document.getElementById('toolModalLink')
  const toolModalSteps = document.getElementById('toolModalSteps')

  detailBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault()
      const index = parseInt(btn.dataset.tool, 10)
      const data = toolsData[index]
      if (!data) return

      toolModalTitle.textContent = data.name
      toolModalDesc.textContent = data.fullDesc
      toolModalLink.href = data.link

      toolModalSteps.innerHTML = ''
      data.steps.forEach((step, i) => {
        const stepEl = document.createElement('div')
        stepEl.className = 'ai-modal__step'
        stepEl.innerHTML = `
          <span class="ai-modal__step-num">${i + 1}</span>
          <span class="ai-modal__step-text">${step}</span>
        `
        toolModalSteps.appendChild(stepEl)
      })

      modal.classList.add('active')
      document.body.style.overflow = 'hidden'
    })
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

export function initAIPage() {
  initTabs()
  initAigcUI()
  initToolModal()
}
