<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { EMOTIONS, buildQueryWithMood, buildUrlWithMood, getEmotionDesc, getEmotionLabel, normalizeEmotionKey, readEmotionFromQuery } from '../../js/emotions.js'

const route = useRoute()
const router = useRouter()

const currentMood = ref(null)
const lastCopiedId = ref(null)
const copiedGroupKey = ref(null)

const series = [
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

const promptItems = [
  {
    id: 'aigc-0',
    title: '雾中灯塔',
    desc: '深夜海边的孤独灯塔，被浓雾环绕。远处的光束穿透雾气，在海面上投下长长的光路。',
    summary: '深夜海边的孤独灯塔，被浓雾环绕',
    category: 'painting',
    series: 'coast-night',
    mood: 'lonely',
    prompt:
      'A solitary lighthouse on a dark cliff, surrounded by thick fog, beam of light cutting through the mist, reflection on calm ocean surface, cinematic lighting, photorealistic, 8k --ar 3:4 --v 6',
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
    prompt:
      'A narrow alley in a cyberpunk city at night, rain-soaked ground reflecting neon lights, Chinese and Japanese signage, moody atmosphere, volumetric fog, blade runner aesthetic --ar 3:4 --v 6',
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
    prompt:
      'A melancholic solo piano piece, slow tempo, ambient atmosphere, late night mood, minimalistic melody with emotional depth, inspired by Ryuichi Sakamoto and Nils Frahm',
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
    prompt: 'Abstract fluid animation, slow morphing shapes in dark muted tones, ink dissolving in water effect, seamless loop, 4k, cinematic color grading',
    model: 'Runway Gen-3',
    tags: ['Runway', '抽象动画', '流体'],
  },
]

async function copyText(text) {
  const t = String(text || '')
  if (!t) return false
  try {
    await navigator.clipboard.writeText(t)
    return true
  } catch {
    const ta = document.createElement('textarea')
    ta.value = t
    ta.style.position = 'fixed'
    ta.style.left = '-9999px'
    ta.style.top = '0'
    document.body.appendChild(ta)
    ta.focus()
    ta.select()
    try {
      document.execCommand('copy')
      return true
    } catch {
      return false
    } finally {
      ta.remove()
    }
  }
}

function getSeriesMeta(seriesKey) {
  return series.find((s) => s.key === seriesKey) || null
}

function parsePrompt(prompt) {
  const raw = (prompt || '').trim()
  const params = raw.match(/--[a-zA-Z0-9:_-]+(?:\s+[^\s,，]+)?/g) || []
  let main = raw
  params.forEach((p) => {
    main = main.replace(p, '')
  })
  main = main.replace(/\s{2,}/g, ' ').trim()

  const parts = main.includes(',') ? main.split(',') : main.includes('，') ? main.split('，') : [main]
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

  cleaned.slice(1).forEach((seg) => {
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

const moodLabel = computed(() => (currentMood.value ? getEmotionLabel(currentMood.value) : '全部'))
const moodDesc = computed(() => (currentMood.value ? getEmotionDesc(currentMood.value) : '你可以按情绪筛选，像在同一条夜路上挑一盏灯。'))

const filteredPrompts = computed(() => {
  const k = currentMood.value
  if (!k) return promptItems
  return promptItems.filter((x) => normalizeEmotionKey(x.mood) === k)
})

const groupedPrompts = computed(() => {
  const list = filteredPrompts.value
  const map = new Map()
  list.forEach((item) => {
    const seriesMeta = getSeriesMeta(item.series)
    const groupKey = seriesMeta?.key || 'misc'
    if (!map.has(groupKey)) {
      map.set(groupKey, {
        key: groupKey,
        title: seriesMeta?.title || '未归档',
        desc: seriesMeta?.desc || '一些散落的提示词片段。',
        mood: seriesMeta?.mood || item.mood,
        items: [],
      })
    }
    map.get(groupKey).items.push(item)
  })
  return Array.from(map.values())
})

function setMood(nextMood) {
  router.replace({ query: buildQueryWithMood(route.query, nextMood) })
}

function syncMoodFromRoute() {
  currentMood.value = readEmotionFromQuery(route.query)
}

async function onCopyPrompt(item) {
  const ok = await copyText(item?.prompt)
  lastCopiedId.value = ok ? item?.id : null
  if (ok) {
    window.setTimeout(() => {
      if (lastCopiedId.value === item?.id) lastCopiedId.value = null
    }, 900)
  }
}

function buildGroupText(group) {
  const lines = []
  lines.push(`情绪：${getEmotionLabel(currentMood.value) || '全部'}`)
  lines.push(`系列：${group?.title || '未命名'}`)
  lines.push('')
  ;(group?.items || []).forEach((item, idx) => {
    lines.push(`${idx + 1}. ${item.title}`)
    if (item.model) lines.push(`模型：${item.model}`)
    if (item.prompt) lines.push(item.prompt)
    lines.push('')
  })
  return lines.join('\n').trim()
}

async function onCopyGroup(group) {
  const ok = await copyText(buildGroupText(group))
  copiedGroupKey.value = ok ? group?.key : null
  if (ok) {
    window.setTimeout(() => {
      if (copiedGroupKey.value === group?.key) copiedGroupKey.value = null
    }, 900)
  }
}

onMounted(() => {
  syncMoodFromRoute()
})

watch(
  () => route.query.mood,
  () => syncMoodFromRoute()
)
</script>

<template>
  <div class="ai">
    <section class="ai__hero">
      <h1 class="ai__title">AI</h1>
      <p class="ai__subtitle">
        把难说的感觉翻译成提示词、旋律与句子。<br />
        将线索整理成系列，让“翻译”更像一条可追溯的路径。
      </p>
    </section>

    <section class="ai__panel glass glass--surface">
      <div class="ai__panel-head">
        <div class="ai__panel-title">当前情绪</div>
        <div class="ai__panel-meta">{{ moodLabel }}</div>
      </div>
      <div class="ai__panel-desc">{{ moodDesc }}</div>

      <div class="ai__moods" role="group" aria-label="情绪筛选">
        <button class="ai__mood glass glass--interactive" type="button" :class="{ 'is-active': !currentMood }" @click="setMood(null)">全部</button>
        <button
          v-for="m in EMOTIONS"
          :key="m.key"
          class="ai__mood glass glass--interactive"
          type="button"
          :class="{ 'is-active': currentMood === m.key }"
          @click="setMood(m.key)"
        >
          {{ m.label }}
        </button>
      </div>

      <div class="ai__bridge">
        <RouterLink class="ai__bridge-link glass glass--interactive" :to="buildUrlWithMood('/translate', currentMood)">去翻译</RouterLink>
        <RouterLink class="ai__bridge-link glass glass--interactive" :to="buildUrlWithMood('/words', currentMood)">去读同情绪</RouterLink>
        <RouterLink class="ai__bridge-link glass glass--interactive" :to="buildUrlWithMood('/music', currentMood)">去听同情绪</RouterLink>
      </div>
    </section>

    <section class="ai__section">
      <h2 class="ai__section-title">提示词</h2>

      <div v-if="groupedPrompts.length === 0" class="ai__empty glass glass--surface">
        这一种情绪下暂时没有提示词。你可以换一种情绪，或回到“全部”。
      </div>

      <div v-else class="ai__groups">
        <article v-for="group in groupedPrompts" :key="group.key" class="ai__group glass glass--surface">
          <div class="ai__group-head">
            <div class="ai__group-text">
              <div class="ai__group-title">{{ group.title }}</div>
              <div class="ai__group-desc">{{ group.desc }}</div>
            </div>
            <button class="glass--btn ai__group-copy" type="button" @click="onCopyGroup(group)">
              {{ copiedGroupKey === group.key ? '已复制' : '复制本组' }}
            </button>
          </div>

          <div class="ai__cards">
            <div v-for="item in group.items" :key="item.id" class="ai__card glass glass--surface">
              <div class="ai__card-head">
                <div class="ai__card-title">{{ item.title }}</div>
                <button class="glass--btn ai__copy" type="button" @click="onCopyPrompt(item)">
                  {{ lastCopiedId === item.id ? '已复制' : '复制' }}
                </button>
              </div>

              <div class="ai__card-meta">
                <span v-if="item.model" class="ai__meta">{{ item.model }}</span>
                <span v-for="(t, idx) in item.tags" :key="idx" class="ai__tag glass">{{ t }}</span>
              </div>

              <div class="ai__card-desc">{{ item.desc }}</div>

              <pre class="ai__prompt">{{ item.prompt }}</pre>

              <div class="ai__struct">
                <div v-for="(label, key) in { subject: '主体', scene: '环境', lighting: '光影', camera: '镜头', style: '风格', params: '参数' }" :key="key">
                  <template v-if="parsePrompt(item.prompt)[key]?.length">
                    <div class="ai__struct-label">{{ label }}</div>
                    <div class="ai__struct-tags">
                      <button
                        v-for="(part, pidx) in parsePrompt(item.prompt)[key]"
                        :key="pidx"
                        class="ai__struct-tag glass glass--interactive"
                        type="button"
                        @click="copyText(part)"
                      >
                        {{ part }}
                      </button>
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.ai {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding-bottom: var(--space-6);
}

.ai__hero {
  padding: var(--space-4) var(--space-0);
}

.ai__title {
  font-size: var(--space-font-size-5);
  color: var(--color-text-0);
  margin: var(--space-0);
}

.ai__subtitle {
  margin: var(--space-1) var(--space-0) var(--space-0);
  max-width: var(--space-layout-subtitle-max-width);
  color: var(--color-text-1);
}

.ai__panel {
  padding: var(--space-4);
}

.ai__panel-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-2);
}

.ai__panel-title {
  font-size: var(--space-font-size-2);
  color: var(--color-text-0);
}

.ai__panel-meta {
  font-size: var(--space-font-size-0);
  color: var(--color-accent);
}

.ai__panel-desc {
  margin-top: var(--space-1);
  color: var(--color-text-1);
}

.ai__moods {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  margin-top: var(--space-2);
}

.ai__mood {
  padding: var(--space-0-5) var(--space-1-5);
  border-radius: var(--radius-round);
  font-size: var(--space-font-size-0);
  color: var(--color-text-1);
  transition: background var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast);
}

.ai__mood:hover {
  background: var(--color-glass-bg-hover);
  border-color: var(--color-glass-border-hover);
  color: var(--color-text-0);
}

.ai__mood.is-active {
  color: var(--color-text-0);
  border-color: var(--color-glass-border-hover);
  background: var(--color-accent-alpha);
}

.ai__bridge {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  margin-top: var(--space-3);
}

.ai__bridge-link {
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-round);
  font-size: var(--space-font-size-0);
  color: var(--color-text-0);
  transition: background var(--transition-fast), border-color var(--transition-fast);
  border: var(--space-0-125) solid var(--color-glass-border);
  background: var(--color-glass-bg);
}

.ai__bridge-link:hover {
  background: var(--color-glass-bg-hover);
  border-color: var(--color-glass-border-hover);
}

.ai__section-title {
  font-size: var(--space-font-size-3);
  color: var(--color-text-0);
  margin: var(--space-0);
}

.ai__empty {
  margin-top: var(--space-2);
  padding: var(--space-3);
  color: var(--color-text-1);
}

.ai__groups {
  margin-top: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.ai__group {
  padding: var(--space-4);
  max-width: var(--space-layout-reading-max-width);
  margin-left: auto;
  margin-right: auto;
}

.ai__group-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-2);
}

.ai__group-title {
  font-size: var(--space-font-size-3);
  color: var(--color-text-0);
}

.ai__group-desc {
  margin-top: var(--space-1);
  color: var(--color-text-1);
}

.ai__group-copy {
  color: var(--color-text-0);
  font-size: var(--space-font-size-0);
}

.ai__cards {
  margin-top: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.ai__card {
  padding: var(--space-3);
}

.ai__card-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-2);
}

.ai__card-title {
  font-size: var(--space-font-size-2);
  color: var(--color-text-0);
}

.ai__copy {
  color: var(--color-text-0);
  font-size: var(--space-font-size-0);
}

.ai__card-meta {
  margin-top: var(--space-1);
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  align-items: center;
}

.ai__meta {
  color: var(--color-text-2);
  font-size: var(--space-font-size-0);
}

.ai__tag {
  padding: var(--space-0-25) var(--space-1);
  border-radius: var(--radius-round);
  font-size: var(--space-font-size-0);
  color: var(--color-text-1);
}

.ai__card-desc {
  margin-top: var(--space-2);
  color: var(--color-text-1);
}

.ai__prompt {
  margin-top: var(--space-2);
  padding: var(--space-2);
  border-radius: var(--radius-2);
  border: var(--space-0-125) solid var(--color-glass-border);
  background: var(--color-glass-bg);
  color: var(--color-text-0);
  font-family: var(--space-font-family-sans);
  font-size: var(--space-font-size-0);
  line-height: var(--space-font-line-height-base);
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.ai__struct {
  margin-top: var(--space-2);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.ai__struct-label {
  color: var(--color-text-2);
  font-size: var(--space-font-size-0);
  margin-bottom: var(--space-0-5);
}

.ai__struct-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}

.ai__struct-tag {
  padding: var(--space-0-25) var(--space-1);
  border-radius: var(--radius-round);
  font-size: var(--space-font-size-0);
  color: var(--color-text-1);
  transition: background var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast);
}

.ai__struct-tag:hover {
  background: var(--color-glass-bg-hover);
  border-color: var(--color-glass-border-hover);
  color: var(--color-text-0);
}

@media (max-width: 860px) {
  .ai__panel {
    padding: var(--space-3);
  }

  .ai__group {
    padding: var(--space-3);
    margin-left: var(--space-0);
    margin-right: var(--space-0);
  }

  .ai__card {
    padding: var(--space-2);
  }
}
</style>
