const aigcData = [
  {
    title: '雾中灯塔',
    desc: '深夜海边的孤独灯塔，被浓雾环绕。远处的光束穿透雾气，在海面上投下长长的光路。',
    category: 'painting',
    gradient: 'linear-gradient(135deg, #2a2a3d, #1a1a2e)',
    prompt: 'A solitary lighthouse on a dark cliff, surrounded by thick fog, beam of light cutting through the mist, reflection on calm ocean surface, cinematic lighting, photorealistic, 8k --ar 3:4 --v 6',
    model: 'Midjourney v6',
    tags: ['Midjourney', '写实风', '夜景'],
  },
  {
    title: '城市独白',
    desc: '用 AI 生成的都市情感短文系列，捕捉城市生活中那些细微的情绪波动。',
    category: 'copywriting',
    gradient: 'linear-gradient(135deg, #1e2a3a, #0f1923)',
    prompt: '写一篇关于深夜独自走在城市街道上的散文，300字左右，风格要带有淡淡的忧伤和对生活的思考，不要太矫情，像一个人在和自己对话。',
    model: 'Claude 3.5 Sonnet',
    tags: ['Claude', '散文', '情感'],
  },
  {
    title: '赛博雨巷',
    desc: '霓虹灯下的雨夜小巷，赛博朋克风格。湿漉漉的地面反射着五彩的霓虹光。',
    category: 'painting',
    gradient: 'linear-gradient(135deg, #2d1f3d, #1a1225)',
    prompt: 'A narrow alley in a cyberpunk city at night, rain-soaked ground reflecting neon lights, Chinese and Japanese signage, moody atmosphere, volumetric fog, blade runner aesthetic --ar 3:4 --v 6',
    model: 'Stable Diffusion XL',
    tags: ['Stable Diffusion', '赛博朋克', '雨景'],
  },
  {
    title: '午夜钢琴曲',
    desc: 'AI 生成的氛围钢琴旋律，适合深夜聆听。简单的几个音符，却能触动心底最柔软的地方。',
    category: 'music',
    gradient: 'linear-gradient(135deg, #1a2530, #0d1520)',
    prompt: 'A melancholic solo piano piece, slow tempo, ambient atmosphere, late night mood, minimalistic melody with emotional depth, inspired by Ryuichi Sakamoto and Nils Frahm',
    model: 'Suno v3.5',
    tags: ['Suno', '氛围音乐', '钢琴'],
  },
  {
    title: '时间的形状',
    desc: '抽象流体动画，探索时间与空间的视觉隐喻。色彩在画布上自由流动、融合、消散。',
    category: 'video',
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

function initFilter() {
  const filterTags = document.querySelectorAll('.ai-filter__tag')
  const cards = document.querySelectorAll('.ai-card')

  filterTags.forEach((tag) => {
    tag.addEventListener('click', () => {
      const filter = tag.dataset.filter
      filterTags.forEach((t) => t.classList.remove('active'))
      tag.classList.add('active')

      cards.forEach((card) => {
        const category = card.dataset.category
        if (filter === 'all' || category === filter) {
          card.style.display = ''
        } else {
          card.style.display = 'none'
        }
      })
    })
  })
}

function initAigcModal() {
  const modal = document.getElementById('aigcModal')
  const closeBtn = document.getElementById('aigcModalClose')
  const cards = document.querySelectorAll('.ai-card')
  if (!modal) return

  const modalImage = document.getElementById('modalImage')
  const modalTitle = document.getElementById('modalTitle')
  const modalDesc = document.getElementById('modalDesc')
  const modalPromptCode = document.getElementById('modalPromptCode')
  const modalMeta = document.getElementById('modalMeta')

  cards.forEach((card) => {
    card.addEventListener('click', () => {
      const index = parseInt(card.dataset.index, 10)
      const data = aigcData[index]
      if (!data) return

      modalImage.style.background = data.gradient
      modalTitle.textContent = data.title
      modalDesc.textContent = data.desc
      modalPromptCode.textContent = data.prompt

      modalMeta.innerHTML = ''
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
  initFilter()
  initAigcModal()
  initToolModal()
}
