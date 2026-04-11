import { EMOTIONS, getEmotionLabel, normalizeEmotionKey, readEmotionFromUrl, replaceMoodInCurrentUrl, buildUrlWithMood } from '../emotions.js'

function svgDataUri(svg) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

const SERIES_DATA = [
  {
    key: 'coast-night',
    title: '深夜海岸',
    desc: '雾、潮声与低频的光，适合把心事放远。',
    mood: 'lonely',
  },
  {
    key: 'city-soliloquy',
    title: '城市独白',
    desc: '霓虹与人群的背面，写给独行者的旁白。',
    mood: 'melancholy',
  },
  {
    key: 'time-fluid',
    title: '时间的形状',
    desc: '让抽象替你说话，时间在暗处缓慢流动。',
    mood: 'calm',
  },
]

const PREVIEW_IMAGES = {
  lighthouse: svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a2a3d"/><stop offset="1" stop-color="#1a1a2e"/></linearGradient><linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0f1522"/><stop offset="1" stop-color="#070b12"/></linearGradient><linearGradient id="beam" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff" stop-opacity="0.55"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient></defs><rect width="800" height="600" fill="url(#g)"/><rect y="360" width="800" height="240" fill="url(#sea)"/><path d="M0 420 C120 400 220 450 360 430 C520 405 610 445 800 420 L800 600 L0 600 Z" fill="#0b1220" opacity="0.7"/><g opacity="0.75"><circle cx="620" cy="120" r="42" fill="#d7e3ff" opacity="0.25"/><circle cx="660" cy="160" r="18" fill="#d7e3ff" opacity="0.18"/></g><g transform="translate(130 140)"><path d="M120 420 L220 260 L320 420 Z" fill="#0b101a" opacity="0.95"/><rect x="220" y="190" width="54" height="230" rx="6" fill="#121a28"/><rect x="232" y="215" width="30" height="26" rx="3" fill="#2a3a55" opacity="0.85"/><rect x="232" y="255" width="30" height="26" rx="3" fill="#2a3a55" opacity="0.6"/><rect x="232" y="295" width="30" height="26" rx="3" fill="#2a3a55" opacity="0.45"/><rect x="232" y="335" width="30" height="26" rx="3" fill="#2a3a55" opacity="0.32"/><rect x="214" y="180" width="92" height="22" rx="8" fill="#0f1522"/><circle cx="260" cy="174" r="10" fill="#d7e3ff" opacity="0.35"/></g><path d="M330 250 L800 165 L800 260 Z" fill="url(#beam)"/></svg>`),
  city: svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1e2a3a"/><stop offset="1" stop-color="#0f1923"/></linearGradient><linearGradient id="h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b111a"/><stop offset="1" stop-color="#05080d"/></linearGradient></defs><rect width="800" height="600" fill="url(#g)"/><circle cx="610" cy="140" r="70" fill="#c7d8ff" opacity="0.10"/><circle cx="650" cy="180" r="26" fill="#c7d8ff" opacity="0.08"/><rect y="330" width="800" height="270" fill="url(#h)"/><g opacity="0.92"><rect x="70" y="260" width="110" height="340" fill="#0b0f17"/><rect x="190" y="200" width="150" height="400" fill="#0a0e15"/><rect x="350" y="245" width="120" height="355" fill="#0b111a"/><rect x="480" y="180" width="210" height="420" fill="#080c12"/><rect x="700" y="280" width="70" height="320" fill="#0a0f16"/></g><g fill="#d7e3ff"><g opacity="0.30"><rect x="100" y="300" width="14" height="18"/><rect x="128" y="338" width="14" height="18"/><rect x="218" y="250" width="14" height="18"/><rect x="248" y="290" width="14" height="18"/><rect x="278" y="330" width="14" height="18"/><rect x="402" y="290" width="14" height="18"/><rect x="510" y="230" width="14" height="18"/><rect x="540" y="260" width="14" height="18"/><rect x="570" y="300" width="14" height="18"/><rect x="600" y="340" width="14" height="18"/></g><g opacity="0.18"><rect x="122" y="380" width="14" height="18"/><rect x="232" y="370" width="14" height="18"/><rect x="262" y="410" width="14" height="18"/><rect x="540" y="400" width="14" height="18"/><rect x="630" y="420" width="14" height="18"/></g></g><path d="M0 520 C140 500 260 540 400 520 C560 496 660 540 800 520 L800 600 L0 600 Z" fill="#070b12" opacity="0.75"/></svg>`),
  cyber: svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2d1f3d"/><stop offset="1" stop-color="#1a1225"/></linearGradient><linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0f0a18"/><stop offset="1" stop-color="#05030a"/></linearGradient></defs><rect width="800" height="600" fill="url(#g)"/><rect y="330" width="800" height="270" fill="url(#floor)" opacity="0.95"/><path d="M140 90 L300 600 H0 V220 Z" fill="#0b0a12" opacity="0.85"/><path d="M660 90 L800 220 V600 H500 Z" fill="#0b0a12" opacity="0.85"/><g opacity="0.85"><path d="M150 260 L320 240" stroke="#7ae7ff" stroke-width="6" stroke-linecap="round"/><path d="M540 220 L650 200" stroke="#ff6bd6" stroke-width="6" stroke-linecap="round"/><path d="M210 340 L360 320" stroke="#9cff6b" stroke-width="5" stroke-linecap="round" opacity="0.75"/><path d="M480 320 L640 300" stroke="#7ae7ff" stroke-width="5" stroke-linecap="round" opacity="0.65"/></g><g opacity="0.6"><rect x="170" y="140" width="90" height="48" rx="10" fill="#ff6bd6"/><rect x="540" y="150" width="110" height="54" rx="12" fill="#7ae7ff"/><rect x="250" y="210" width="70" height="36" rx="9" fill="#9cff6b"/></g><path d="M240 350 L560 320 L640 600 H160 Z" fill="#07060f" opacity="0.75"/><path d="M260 380 L540 355" stroke="#7ae7ff" stroke-width="2" opacity="0.35"/><path d="M280 420 L520 395" stroke="#ff6bd6" stroke-width="2" opacity="0.25"/></svg>`),
  piano: svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1a2530"/><stop offset="1" stop-color="#0d1520"/></linearGradient><linearGradient id="k" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#cbd4e6"/></linearGradient></defs><rect width="800" height="600" fill="url(#g)"/><circle cx="610" cy="140" r="78" fill="#c7d8ff" opacity="0.10"/><circle cx="660" cy="190" r="26" fill="#c7d8ff" opacity="0.08"/><g transform="translate(120 290)"><rect x="0" y="0" width="560" height="240" rx="22" fill="#0a1018" opacity="0.85"/><rect x="30" y="35" width="500" height="170" rx="14" fill="#0d1520"/><g transform="translate(52 58)"><rect width="456" height="124" rx="10" fill="url(#k)" opacity="0.92"/><g fill="#1a2530" opacity="0.85"><rect x="52" y="0" width="32" height="78" rx="6"/><rect x="106" y="0" width="32" height="78" rx="6"/><rect x="186" y="0" width="32" height="78" rx="6"/><rect x="240" y="0" width="32" height="78" rx="6"/><rect x="294" y="0" width="32" height="78" rx="6"/><rect x="372" y="0" width="32" height="78" rx="6"/></g><path d="M0 88 H456" stroke="#92a6c8" stroke-opacity="0.35" stroke-width="2"/></g><path d="M420 16 C520 68 560 140 560 220 V240 H420 Z" fill="#070b12" opacity="0.55"/></g><path d="M0 560 C160 520 300 590 420 555 C560 518 650 590 800 560 L800 600 L0 600 Z" fill="#05080f" opacity="0.65"/></svg>`),
  fluid: svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#25201a"/><stop offset="1" stop-color="#1a150f"/></linearGradient><radialGradient id="a" cx="30%" cy="35%" r="70%"><stop offset="0" stop-color="#a7d2ff" stop-opacity="0.35"/><stop offset="1" stop-color="#a7d2ff" stop-opacity="0"/></radialGradient><radialGradient id="b" cx="70%" cy="60%" r="70%"><stop offset="0" stop-color="#ff9bd6" stop-opacity="0.25"/><stop offset="1" stop-color="#ff9bd6" stop-opacity="0"/></radialGradient></defs><rect width="800" height="600" fill="url(#g)"/><path d="M150 210 C220 120 360 120 420 210 C490 312 620 290 680 220 C740 150 770 170 800 220 V600 H0 V260 C40 270 90 260 150 210 Z" fill="url(#a)"/><path d="M80 440 C140 360 260 350 320 420 C400 510 520 520 590 450 C650 400 720 370 800 400 V600 H0 V520 C30 500 55 475 80 440 Z" fill="url(#b)"/><g opacity="0.55"><path d="M110 260 C200 210 290 250 360 310 C430 370 520 380 610 340" fill="none" stroke="#d7e3ff" stroke-opacity="0.28" stroke-width="5" stroke-linecap="round"/><path d="M140 330 C240 290 320 320 390 370 C470 430 560 430 660 390" fill="none" stroke="#ffd3ea" stroke-opacity="0.22" stroke-width="4" stroke-linecap="round"/></g><g opacity="0.6"><circle cx="220" cy="160" r="10" fill="#d7e3ff" opacity="0.35"/><circle cx="260" cy="190" r="6" fill="#d7e3ff" opacity="0.25"/><circle cx="560" cy="220" r="12" fill="#ffd3ea" opacity="0.25"/><circle cx="600" cy="250" r="7" fill="#ffd3ea" opacity="0.18"/></g></svg>`),
}

const aigcData = [
  {
    id: 'aigc-0',
    title: '雾中灯塔',
    desc: '深夜海边的孤独灯塔，被浓雾环绕。远处的光束穿透雾气，在海面上投下长长的光路。',
    summary: '深夜海边的孤独灯塔，被浓雾环绕',
    category: 'painting',
    series: 'coast-night',
    mood: 'lonely',
    gradient: 'linear-gradient(135deg, #2a2a3d, #1a1a2e)',
    image: PREVIEW_IMAGES.lighthouse,
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
    mood: 'melancholy',
    gradient: 'linear-gradient(135deg, #1e2a3a, #0f1923)',
    image: PREVIEW_IMAGES.city,
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
    mood: 'melancholy',
    gradient: 'linear-gradient(135deg, #2d1f3d, #1a1225)',
    image: PREVIEW_IMAGES.cyber,
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
    mood: 'lonely',
    gradient: 'linear-gradient(135deg, #1a2530, #0d1520)',
    image: PREVIEW_IMAGES.piano,
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
    mood: 'calm',
    gradient: 'linear-gradient(135deg, #25201a, #1a150f)',
    image: PREVIEW_IMAGES.fluid,
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
  series: 'gaia_ai_series',
}
const aigcIndexMap = new Map(aigcData.map((item, index) => [item.id, index]))

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
  const artStyle = data.image
    ? `background: ${data.gradient}; background-image: url('${data.image}'); background-size: cover; background-position: center; background-repeat: no-repeat;`
    : `background: ${data.gradient};`

  card.innerHTML = `
    <button class="ai-card__fav" type="button" aria-label="收藏">${ICONS.heart}</button>
    <div class="ai-card__image" style="${artStyle}"></div>
    <h3 class="ai-card__title">${data.title}</h3>
    <p class="ai-card__desc">${data.summary || data.desc}</p>
    <div class="ai-card__tags">${tagsHtml}</div>
  `

  return card
}

function renderSeriesCard(data, options = {}) {
  const card = renderAigcCard(data, aigcIndexMap.get(data.id) ?? 0)
  card.classList.add(options.lead ? 'ai-card--series-lead' : 'ai-card--series-compact')
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

function renderSeriesView(filterMood = null) {
  const el = document.getElementById('seriesView')
  if (!el) return
  el.innerHTML = ''

  const frag = document.createDocumentFragment()

  const moodKey = normalizeEmotionKey(filterMood)
  const list = moodKey ? SERIES_DATA.filter((s) => s.mood === moodKey) : SERIES_DATA

  list.forEach((series) => {
    const items = aigcData.filter((x) => x.series === series.key)
    if (items.length === 0) return

    const wrap = document.createElement('div')
    wrap.className = 'ai-series glass-card'
    wrap.dataset.series = series.key

    wrap.innerHTML = `
      <div class="ai-series__layout">
        <div class="ai-series__head">
          <div class="ai-series__text">
            <span class="ai-series__eyebrow">Curated Series</span>
            <h3 class="ai-series__title">${series.title}</h3>
            <p class="ai-series__desc">${series.desc}</p>
            <p class="ai-series__note">围绕同一情绪命题整理作品线索，让每一组图像像同一段心绪的不同切面。</p>
          </div>
          <div class="ai-series__actions">
            <span class="glass-tag ai-series__count">${items.length} 件内容</span>
            <button class="glass-btn ai-series__open" type="button" data-series="${series.key}">进入系列</button>
          </div>
        </div>
        <div class="ai-series__body">
          <div class="ai-series__lead"></div>
          <div class="ai-series__grid"></div>
        </div>
      </div>
    `
    const lead = wrap.querySelector('.ai-series__lead')
    const grid = wrap.querySelector('.ai-series__grid')
    if (lead) lead.appendChild(renderSeriesCard(items[0], { lead: true }))
    items.slice(1).forEach((item) => grid?.appendChild(renderSeriesCard(item)))
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
  const series = localStorage.getItem(STORAGE_KEYS.series) || ''
  return {
    view: 'series',
    series: series || null,
  }
}

function setStateToStorage(state) {
  localStorage.setItem(STORAGE_KEYS.series, state.series || '')
}

function syncFavoriteClasses(favoritesSet) {
  document.querySelectorAll('.ai-card').forEach((card) => {
    const id = card.dataset.id
    card.classList.toggle('is-favorited', !!id && favoritesSet.has(id))
  })
}

function applyView(state) {
  const gallery = document.getElementById('aigcGallery')
  const series = document.getElementById('seriesView')
  if (gallery) gallery.hidden = true
  if (series) series.hidden = false
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
  renderAigcGallery()
  let moodFilter = readEmotionFromUrl()
  renderSeriesView(moodFilter)

  let state = getStateFromStorage()

  const favorites = readList(STORAGE_KEYS.favorites)
  const recent = readList(STORAGE_KEYS.recent)
  let favoritesSet = new Set(favorites)
  let recentSet = new Set(recent)

  function recompute() {
    syncFavoriteClasses(favoritesSet)
    syncSeriesBar(state)
    applyView(state)
    setStateToStorage(state)
  }

  const seriesClearBtn = document.getElementById('seriesBarClear')
  if (seriesClearBtn) {
    seriesClearBtn.addEventListener('click', () => {
      state.series = null
      recompute()
    })
  }

  const moodTagsEl = document.getElementById('aiMoodTags')
  const toMusic = document.getElementById('aiMoodToMusic')
  const toWords = document.getElementById('aiMoodToWords')
  const controlsEl = document.querySelector('#panelAigc .ai-controls')
  let scrollRaf = 0

  function syncControlsDensity() {
    if (!controlsEl) return
    const condensed = window.scrollY > 140
    controlsEl.classList.toggle('ai-controls--condensed', condensed)
  }

  function onScroll() {
    if (scrollRaf) return
    scrollRaf = window.requestAnimationFrame(() => {
      scrollRaf = 0
      syncControlsDensity()
    })
  }

  window.addEventListener('scroll', onScroll, { passive: true })
  syncControlsDensity()

  function syncMoodLinks() {
    const key = normalizeEmotionKey(moodFilter)
    if (toMusic) toMusic.setAttribute('href', buildUrlWithMood('/pages/music.html', key))
    if (toWords) toWords.setAttribute('href', buildUrlWithMood('/pages/words.html', key))
  }

  function renderMoodTags() {
    if (!moodTagsEl) return
    moodTagsEl.innerHTML = ''

    const frag = document.createDocumentFragment()

    EMOTIONS.forEach((m) => {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = `glass-tag${moodFilter === m.key ? ' active' : ''}`
      btn.dataset.mood = m.key
      btn.textContent = m.label
      frag.appendChild(btn)
    })

    moodTagsEl.appendChild(frag)
  }

  function applyMoodFilter(nextMood) {
    const next = normalizeEmotionKey(nextMood)
    moodFilter = next && next === moodFilter ? null : next
    replaceMoodInCurrentUrl(moodFilter)
    renderMoodTags()
    syncMoodLinks()
    renderSeriesView(moodFilter)
  }

  if (moodTagsEl) {
    moodTagsEl.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-mood]')
      if (!btn) return
      applyMoodFilter(btn.dataset.mood)
    })
  }

  renderMoodTags()
  syncMoodLinks()

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

    if (modalImage) {
      modalImage.style.background = data.gradient
      if (data.image) {
        modalImage.style.backgroundImage = `url('${data.image}')`
        modalImage.style.backgroundSize = 'cover'
        modalImage.style.backgroundPosition = 'center'
        modalImage.style.backgroundRepeat = 'no-repeat'
      } else {
        modalImage.style.backgroundImage = ''
      }
    }
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
          state.series = data.series
          closeModal()
          recompute()
          document.getElementById('panelAigc')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        })
        modalMeta.appendChild(seriesBtn)
      }

      const moodKey = normalizeEmotionKey(data.mood || seriesMeta?.mood)
      if (moodKey) {
        const moodTag = document.createElement('span')
        moodTag.className = 'glass-tag'
        moodTag.textContent = `情绪：${getEmotionLabel(moodKey)}`
        modalMeta.appendChild(moodTag)

        const moodMusic = document.createElement('a')
        moodMusic.className = 'glass-tag'
        moodMusic.setAttribute('href', buildUrlWithMood('/pages/music.html', moodKey))
        moodMusic.textContent = '去听同情绪'
        modalMeta.appendChild(moodMusic)

        const moodWords = document.createElement('a')
        moodWords.className = 'glass-tag'
        moodWords.setAttribute('href', buildUrlWithMood('/pages/words.html', moodKey))
        moodWords.textContent = '去读同情绪'
        modalMeta.appendChild(moodWords)
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
        state.series = key
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

  recompute()

  return () => {
    window.removeEventListener('scroll', onScroll)
    if (scrollRaf) {
      window.cancelAnimationFrame(scrollRaf)
      scrollRaf = 0
    }
    if (copyPromptBtn) copyPromptBtn.removeEventListener('click', onCopyPrompt)
    document.removeEventListener('keydown', onKeyDown)
    document.removeEventListener('click', onDocClick)
    if (modal) modal.classList.remove('active')
    document.body.style.overflow = ''
  }
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

  function onDocKeyDown(e) {
    if (e.key === 'Escape' && modal.classList.contains('active')) closeModal()
  }
  document.addEventListener('keydown', onDocKeyDown)

  return () => {
    document.removeEventListener('keydown', onDocKeyDown)
    modal.classList.remove('active')
    document.body.style.overflow = ''
  }
}

export function initAIPage() {
  initTabs()
  const cleanupAigc = initAigcUI()
  const cleanupTool = initToolModal()
  return () => {
    if (typeof cleanupAigc === 'function') cleanupAigc()
    if (typeof cleanupTool === 'function') cleanupTool()
  }
}
