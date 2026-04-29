<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getEmotionDesc, getEmotionLabel, buildUrlWithMood } from '../../js/emotions.js'
import { translateEmotion, translateEmotionAsync, hasSelfHarmRisk } from '../../js/emotion-translator.js'

const route = useRoute()

const STORAGE_KEY = 'gaia_emotion_translate_history_v1'
const HISTORY_LIMIT = 10

const inputText = ref('')
const scene = ref('self')
const tone = ref('restrained')
const intensity = ref(60)

const isSafety = ref(false)
const isReady = ref(false)
const isTranslating = ref(false)

const currentEntryId = ref(null)
const result = ref(null)

const oneLine = ref('')
const rewriteShort = ref('')
const rewriteLong = ref('')
const rewriteDialogue = ref('')
const promptImage = ref('')
const promptMusic = ref('')
const promptWords = ref('')

const history = ref([])

const intensityLabel = computed(() => String(intensity.value))
const moodPrimaryLabel = computed(() => getEmotionLabel(result.value?.moodPrimary))
const moodPrimaryDesc = computed(() => getEmotionDesc(result.value?.moodPrimary))
const moodSecondaryLabels = computed(() =>
  (result.value?.moodSecondary || []).map((k) => getEmotionLabel(k)).filter(Boolean)
)

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

function nowISO() {
  return new Date().toISOString()
}

function safeJsonParse(str, fallback) {
  try {
    return JSON.parse(str)
  } catch {
    return fallback
  }
}

function readHistory() {
  const raw = window.localStorage.getItem(STORAGE_KEY)
  const list = safeJsonParse(raw, [])
  return Array.isArray(list) ? list : []
}

function writeHistory(list) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, HISTORY_LIMIT)))
}

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

function snapshotEdits() {
  return {
    etOneLine: oneLine.value,
    etRewriteShort: rewriteShort.value,
    etRewriteLong: rewriteLong.value,
    etRewriteDialog: rewriteDialogue.value,
    etPromptImage: promptImage.value,
    etPromptMusic: promptMusic.value,
    etPromptWords: promptWords.value,
  }
}

function applyResultToEditableFields(nextResult, edits) {
  const merged = {
    ...nextResult,
    rewrites: { ...(nextResult?.rewrites || {}) },
    prompts: { ...(nextResult?.prompts || {}) },
  }

  if (edits && typeof edits === 'object') {
    if (typeof edits.etOneLine === 'string') merged.oneLine = edits.etOneLine
    if (typeof edits.etRewriteShort === 'string') merged.rewrites.short = edits.etRewriteShort
    if (typeof edits.etRewriteLong === 'string') merged.rewrites.long = edits.etRewriteLong
    if (typeof edits.etRewriteDialog === 'string') merged.rewrites.dialogue = edits.etRewriteDialog
    if (typeof edits.etPromptImage === 'string') merged.prompts.image = edits.etPromptImage
    if (typeof edits.etPromptMusic === 'string') merged.prompts.music = edits.etPromptMusic
    if (typeof edits.etPromptWords === 'string') merged.prompts.words = edits.etPromptWords
  }

  result.value = merged
  oneLine.value = merged.oneLine || ''
  rewriteShort.value = merged.rewrites?.short || ''
  rewriteLong.value = merged.rewrites?.long || ''
  rewriteDialogue.value = merged.rewrites?.dialogue || ''
  promptImage.value = merged.prompts?.image || ''
  promptMusic.value = merged.prompts?.music || ''
  promptWords.value = merged.prompts?.words || ''
}

function syncHistory() {
  history.value = readHistory()
}

function ensureCurrentEntry() {
  const list = readHistory()
  const idx = currentEntryId.value ? list.findIndex((x) => x.id === currentEntryId.value) : -1
  if (idx >= 0) return { list, idx, entry: list[idx] }

  if (!result.value) return { list, idx: -1, entry: null }

  const entry = {
    id: `${Date.now()}`,
    ts: nowISO(),
    input: inputText.value,
    result: result.value,
    edits: snapshotEdits(),
    prefs: {
      scene: scene.value,
      tone: tone.value,
      intensity: intensity.value,
    },
  }

  const next = [entry, ...list].slice(0, HISTORY_LIMIT)
  writeHistory(next)
  currentEntryId.value = entry.id
  syncHistory()
  return { list: next, idx: 0, entry }
}

function saveEdits() {
  const { list, idx, entry } = ensureCurrentEntry()
  if (!entry || idx < 0) return
  const nextEntry = { ...entry, edits: snapshotEdits(), result: result.value }
  const next = [...list]
  next[idx] = nextEntry
  writeHistory(next)
  syncHistory()
}

function clearHistory() {
  window.localStorage.removeItem(STORAGE_KEY)
  currentEntryId.value = null
  syncHistory()
}

function restoreEntry(entry) {
  if (!entry) return
  currentEntryId.value = entry.id || null
  inputText.value = entry.input || ''
  scene.value = entry?.prefs?.scene || 'self'
  tone.value = entry?.prefs?.tone || 'restrained'
  intensity.value = clamp(Number(entry?.prefs?.intensity ?? 60), 0, 100)
  applyResultToEditableFields(entry.result, entry.edits)
  isSafety.value = hasSelfHarmRisk(inputText.value)
}

function buildHistoryMeta(entry) {
  const moodLabel = getEmotionLabel(entry?.result?.moodPrimary)
  const preview = (entry?.input || '').trim().slice(0, 24)
  const time = entry?.ts ? new Date(entry.ts).toLocaleString() : ''
  return { moodLabel, preview, time }
}

function pickSample() {
  const samples = [
    '我不知道我怎么了，就是很累，很想一个人。',
    '我不是真的生气，我只是觉得自己不重要。',
    '我其实没那么难过，但心里一直空着。',
    '我想好好工作，但我被情绪拖着走。',
  ]
  const i = Math.floor(Math.random() * samples.length)
  inputText.value = samples[i]
  nextTick(() => runTranslate())
}

function clearAll() {
  inputText.value = ''
  isSafety.value = false
  currentEntryId.value = null
  result.value = null
  oneLine.value = ''
  rewriteShort.value = ''
  rewriteLong.value = ''
  rewriteDialogue.value = ''
  promptImage.value = ''
  promptMusic.value = ''
  promptWords.value = ''
}

async function runTranslate() {
  const raw = String(inputText.value || '').trim()
  if (!raw) return

  if (hasSelfHarmRisk(raw)) {
    isSafety.value = true
    result.value = null
    currentEntryId.value = null
    return
  }

  isSafety.value = false
  currentEntryId.value = null
  isTranslating.value = true

  const nextResult = await translateEmotionAsync(raw, {
    scene: scene.value,
    tone: tone.value,
    intensity: intensity.value,
  })

  isTranslating.value = false

  if (nextResult.safety) {
    isSafety.value = true
    result.value = null
    return
  }

  applyResultToEditableFields(nextResult, null)
}

function onKeydown(e) {
  const isEnter = e.key === 'Enter'
  if (!isEnter) return
  if (!(e.ctrlKey || e.metaKey)) return
  e.preventDefault()
  runTranslate()
}

function intensityStyle() {
  return { '--et-intensity': `${clamp(result.value?.intensity ?? intensity.value, 0, 100)}%` }
}

onMounted(() => {
  syncHistory()
  isReady.value = true
})

watch(
  () => route.query?.text,
  (next) => {
    if (typeof next !== 'string') return
    const t = next.trim()
    if (!t) return
    inputText.value = t
    isSafety.value = hasSelfHarmRisk(inputText.value)
  },
  { immediate: true }
)

function toMoodLink(pathname) {
  return buildUrlWithMood(pathname, result.value?.moodPrimary)
}

async function copyField(text) {
  await copyText(text)
}
</script>

<template>
  <div class="et">
    <section class="et__hero">
      <h1 class="et__title">情绪翻译</h1>
      <p class="et__subtitle">把说不清的感觉，翻译成更贴近的语言。解释权永远归你。</p>
    </section>

    <section class="et__shell">
      <div class="et__panel glass glass--surface">
        <div class="et__panel-head">
          <h2 class="et__panel-title">输入</h2>
          <div class="et__hint">Ctrl / ⌘ + Enter 翻译</div>
        </div>

        <textarea
          v-model="inputText"
          class="et__textarea"
          placeholder="随便写。可以很乱、可以很短、可以矛盾。GAIA 会先帮你把它翻译成一句更贴近的话。"
          @keydown="onKeydown"
        />

        <div v-if="isSafety" class="et__safety glass glass--surface" role="alert">
          <div class="et__safety-title">如果你正在经历强烈的自伤/自杀念头</div>
          <div class="et__safety-desc">请优先联系你身边可信的人，或拨打心理援助热线：400-161-9995。</div>
        </div>

        <div class="et__disclaimer">GAIA 不是心理咨询服务。</div>

        <div class="et__field">
          <div class="et__label">用在什么场景</div>
          <div class="et__chips" role="group" aria-label="场景选择">
            <button
              class="et__chip glass glass--interactive"
              type="button"
              :class="{ 'is-active': scene === 'self' }"
              @click="scene = 'self'"
            >
              写给自己
            </button>
            <button
              class="et__chip glass glass--interactive"
              type="button"
              :class="{ 'is-active': scene === 'toSomeone' }"
              @click="scene = 'toSomeone'"
            >
              发给 Ta
            </button>
            <button
              class="et__chip glass glass--interactive"
              type="button"
              :class="{ 'is-active': scene === 'post' }"
              @click="scene = 'post'"
            >
              发动态
            </button>
            <button
              class="et__chip glass glass--interactive"
              type="button"
              :class="{ 'is-active': scene === 'work' }"
              @click="scene = 'work'"
            >
              工作表达
            </button>
          </div>
        </div>

        <div class="et__field">
          <div class="et__label">语气偏好</div>
          <div class="et__chips" role="group" aria-label="语气选择">
            <button
              class="et__chip glass glass--interactive"
              type="button"
              :class="{ 'is-active': tone === 'restrained' }"
              @click="tone = 'restrained'"
            >
              克制
            </button>
            <button class="et__chip glass glass--interactive" type="button" :class="{ 'is-active': tone === 'gentle' }" @click="tone = 'gentle'">
              温柔
            </button>
            <button class="et__chip glass glass--interactive" type="button" :class="{ 'is-active': tone === 'direct' }" @click="tone = 'direct'">
              直白
            </button>
            <button class="et__chip glass glass--interactive" type="button" :class="{ 'is-active': tone === 'poetic' }" @click="tone = 'poetic'">
              诗意
            </button>
          </div>
        </div>

        <div class="et__field">
          <div class="et__row">
            <div class="et__label">强度</div>
            <div class="et__hint">{{ intensityLabel }}/100</div>
          </div>
          <input v-model.number="intensity" class="et__range" type="range" min="0" max="100" aria-label="强度" />
        </div>

        <div class="et__actions">
          <button class="et__btn et__btn--accent glass" type="button" :disabled="isTranslating" @click="runTranslate">
            {{ isTranslating ? '翻译中…' : '开始翻译' }}
          </button>
          <button class="et__btn glass glass--interactive" type="button" :disabled="isTranslating" @click="pickSample">随机示例</button>
          <button class="et__btn glass glass--interactive" type="button" :disabled="isTranslating" @click="clearAll">清空</button>
        </div>
      </div>

      <div class="et__output">
        <div v-if="!result && !isSafety" class="et__empty glass glass--surface">
          写下几句，然后点击“开始翻译”。你会得到一句更贴近的表达、三种改写方式，以及通往音乐/文字/创作的下一步。
        </div>

        <template v-if="result && !isSafety">
          <div class="et__panel glass glass--surface">
            <div class="et__panel-head">
              <h2 class="et__panel-title">结果</h2>
              <button class="et__btn glass glass--interactive" type="button" @click="saveEdits">保存本次</button>
            </div>

            <div class="et__profile">
              <div class="et__profile-top">
                <div class="et__mood">{{ moodPrimaryLabel }}</div>
                <div class="et__tags">
                  <span v-for="(t, idx) in moodSecondaryLabels" :key="idx" class="et__tag glass">{{ t }}</span>
                </div>
              </div>
              <div class="et__desc">{{ moodPrimaryDesc }}</div>
              <div class="et__empathy">{{ result.empathy }}</div>
              <div class="et__intensity" :style="intensityStyle()" role="progressbar" aria-valuemin="0" aria-valuemax="100" />

              <div class="et__links">
                <RouterLink class="et__link glass glass--interactive" :to="toMoodLink('/music')">去听同情绪</RouterLink>
                <RouterLink class="et__link glass glass--interactive" :to="toMoodLink('/words')">去读同情绪</RouterLink>
                <RouterLink class="et__link glass glass--interactive" :to="toMoodLink('/ai')">跟她说说话</RouterLink>
              </div>
            </div>
          </div>

          <div class="et__panel glass glass--surface">
            <div class="et__block">
              <div class="et__block-head">
                <div class="et__block-label">一句话翻译</div>
                <div class="et__block-actions">
                  <button class="et__mini glass glass--interactive" type="button" @click="saveEdits">保存</button>
                  <button class="et__mini glass glass--interactive" type="button" @click="copyField(oneLine)">复制</button>
                </div>
              </div>
              <textarea v-model="oneLine" class="et__editable" rows="3" />
            </div>
          </div>

          <div class="et__panel glass glass--surface">
            <h2 class="et__panel-title">三种表达</h2>

            <div class="et__block">
              <div class="et__block-head">
                <div class="et__block-label">短句</div>
                <div class="et__block-actions">
                  <button class="et__mini glass glass--interactive" type="button" @click="saveEdits">保存</button>
                  <button class="et__mini glass glass--interactive" type="button" @click="copyField(rewriteShort)">复制</button>
                </div>
              </div>
              <textarea v-model="rewriteShort" class="et__editable" rows="3" />
            </div>

            <div class="et__block et__block--gap">
              <div class="et__block-head">
                <div class="et__block-label">长句</div>
                <div class="et__block-actions">
                  <button class="et__mini glass glass--interactive" type="button" @click="saveEdits">保存</button>
                  <button class="et__mini glass glass--interactive" type="button" @click="copyField(rewriteLong)">复制</button>
                </div>
              </div>
              <textarea v-model="rewriteLong" class="et__editable" rows="5" />
            </div>

            <div class="et__block et__block--gap">
              <div class="et__block-head">
                <div class="et__block-label">对话式</div>
                <div class="et__block-actions">
                  <button class="et__mini glass glass--interactive" type="button" @click="saveEdits">保存</button>
                  <button class="et__mini glass glass--interactive" type="button" @click="copyField(rewriteDialogue)">复制</button>
                </div>
              </div>
              <textarea v-model="rewriteDialogue" class="et__editable" rows="5" />
            </div>
          </div>

          <div class="et__panel glass glass--surface">
            <h2 class="et__panel-title">提示词</h2>

            <div class="et__block">
              <div class="et__block-head">
                <div class="et__block-label">图像</div>
                <div class="et__block-actions">
                  <button class="et__mini glass glass--interactive" type="button" @click="saveEdits">保存</button>
                  <button class="et__mini glass glass--interactive" type="button" @click="copyField(promptImage)">复制</button>
                </div>
              </div>
              <textarea v-model="promptImage" class="et__editable" rows="5" />
            </div>

            <div class="et__block et__block--gap">
              <div class="et__block-head">
                <div class="et__block-label">音乐</div>
                <div class="et__block-actions">
                  <button class="et__mini glass glass--interactive" type="button" @click="saveEdits">保存</button>
                  <button class="et__mini glass glass--interactive" type="button" @click="copyField(promptMusic)">复制</button>
                </div>
              </div>
              <textarea v-model="promptMusic" class="et__editable" rows="5" />
            </div>

            <div class="et__block et__block--gap">
              <div class="et__block-head">
                <div class="et__block-label">文字</div>
                <div class="et__block-actions">
                  <button class="et__mini glass glass--interactive" type="button" @click="saveEdits">保存</button>
                  <button class="et__mini glass glass--interactive" type="button" @click="copyField(promptWords)">复制</button>
                </div>
              </div>
              <textarea v-model="promptWords" class="et__editable" rows="5" />
            </div>
          </div>
        </template>

        <section v-if="isReady" class="et__history">
          <div class="et__history-head">
            <h2 class="et__panel-title">最近记录</h2>
            <button class="et__btn glass glass--interactive" type="button" @click="clearHistory">清空记录</button>
          </div>

          <div v-if="history.length === 0" class="et__history-empty glass glass--surface">
            这里会保存你最近的翻译记录（仅本地，点击“保存本次”才会写入）。
          </div>

          <div v-else class="et__history-list">
            <button
              v-for="entry in history"
              :key="entry.id"
              class="et__history-item glass glass--interactive"
              type="button"
              @click="restoreEntry(entry)"
            >
              <div class="et__history-top">
                <div class="et__history-mood">{{ buildHistoryMeta(entry).moodLabel }}</div>
                <div class="et__history-time">{{ buildHistoryMeta(entry).time }}</div>
              </div>
              <div class="et__history-preview">{{ buildHistoryMeta(entry).preview }}</div>
            </button>
          </div>
        </section>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.et {
  padding: var(--space-layout-container-padding-y) var(--space-layout-container-padding-x);
}

.et__hero {
  max-width: var(--space-layout-container-max-width);
  margin: var(--space-0) auto;
  padding: var(--space-4) var(--space-0) var(--space-3);
}

.et__title {
  font-size: var(--space-font-size-6);
  color: var(--color-text-0);
}

.et__subtitle {
  margin-top: var(--space-1);
  color: var(--color-text-1);
  max-width: var(--space-layout-subtitle-max-width);
}

.et__shell {
  max-width: var(--space-layout-container-max-width);
  margin: var(--space-0) auto;
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: start;
}

.et__shell > * {
  flex: 1 1 var(--space-layout-shell-col-min);
}

.et__panel {
  padding: var(--space-3);
}

.et__panel-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-2);
}

.et__panel-title {
  font-size: var(--space-font-size-3);
  color: var(--color-text-0);
}

.et__hint {
  font-size: var(--space-font-size-0);
  color: var(--color-text-2);
}

.et__textarea {
  width: var(--space-100p);
  margin-top: var(--space-2);
  padding: var(--space-2);
  border-radius: var(--radius-2);
  border: var(--space-0-125) solid var(--color-glass-border);
  background: var(--color-glass-bg);
  color: var(--color-text-0);
  min-height: calc(var(--space-6) + var(--space-4));
  resize: vertical;
  line-height: var(--space-font-line-height-base);
  transition: border-color var(--transition-base), background var(--transition-base);
}

.et__textarea::placeholder {
  color: var(--color-text-2);
}

.et__textarea:focus {
  outline: none;
  border-color: var(--color-glass-border-hover);
  background: var(--color-glass-bg-hover);
}

.et__safety {
  margin-top: var(--space-2);
  padding: var(--space-2);
  border-radius: var(--radius-2);
}

.et__safety-title {
  font-size: var(--space-font-size-1);
  color: var(--color-text-0);
}

.et__safety-desc {
  margin-top: var(--space-1);
  color: var(--color-text-1);
}

.et__disclaimer {
  margin-top: var(--space-1);
  font-size: var(--space-font-size-0);
  color: var(--color-text-2);
}

.et__field {
  margin-top: var(--space-3);
}

.et__label {
  font-size: var(--space-font-size-1);
  color: var(--color-text-0);
}

.et__row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-2);
}

.et__chips {
  margin-top: var(--space-1);
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}

.et__chip {
  padding: var(--space-0-5) var(--space-1-5);
  border-radius: var(--radius-round);
  border: var(--space-0-125) solid var(--color-glass-border);
  background: var(--color-glass-bg);
  color: var(--color-text-1);
  transition: background var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast);
}

.et__chip:hover {
  background: var(--color-glass-bg-hover);
  border-color: var(--color-glass-border-hover);
  color: var(--color-text-0);
}

.et__chip.is-active {
  background: var(--color-accent-alpha);
  border-color: var(--color-glass-border-hover);
  color: var(--color-text-0);
}

.et__range {
  margin-top: var(--space-1);
  width: var(--space-100p);
}

.et__actions {
  margin-top: var(--space-3);
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}

.et__btn {
  padding: var(--space-1-5) var(--space-2);
  border-radius: var(--radius-round);
  border: var(--space-0-125) solid var(--color-glass-border);
  background: var(--color-glass-bg);
  color: var(--color-text-0);
  transition: background var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast);
}

.et__btn:hover {
  background: var(--color-glass-bg-hover);
  border-color: var(--color-glass-border-hover);
}

.et__btn--accent {
  background: var(--color-accent-alpha);
  border-color: var(--color-glass-border-hover);
}

.et__btn--accent:hover {
  background: var(--color-accent-alpha-strong);
  border-color: var(--color-glass-border-hover);
}

.et__btn--accent:active {
  background: var(--color-glass-bg-active);
}

.et__btn--accent:disabled {
  opacity: var(--space-opacity-0-6);
  cursor: default;
}

@media (max-width: 860px) {
  .et__hero {
    padding: var(--space-2) var(--space-0) var(--space-1-5);
  }

  .et__title {
    font-size: var(--space-font-size-4);
  }

  .et__shell {
    gap: var(--space-2);
  }

  .et__panel {
    padding: var(--space-2);
  }

  .et__textarea {
    min-height: calc(var(--space-2) * 14);
  }

  .et__row {
    grid-template-columns: 1fr;
  }

  .et__chips {
    gap: var(--space-0-5);
  }

  .et__chip {
    padding: var(--space-0-5) var(--space-1);
  }

  .et__actions {
    flex-direction: column;
    align-items: stretch;
  }

  .et__btn {
    justify-content: center;
  }

  .et__history-head {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-1);
  }

  .et__history-item {
    padding: var(--space-1-5) var(--space-1-25);
  }

  .et__editable {
    padding: var(--space-1-25) var(--space-1-25);
  }
}

.et__output {
  display: grid;
  gap: var(--space-3);
}

.et__empty {
  padding: var(--space-3);
  color: var(--color-text-1);
}

.et__profile {
  margin-top: var(--space-2);
}

.et__profile-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.et__mood {
  font-size: var(--space-font-size-4);
  color: var(--color-text-0);
}

.et__tags {
  display: flex;
  gap: var(--space-1);
  flex-wrap: wrap;
}

.et__tag {
  padding: var(--space-0-5) var(--space-1);
  border-radius: var(--radius-round);
  font-size: var(--space-font-size-0);
  color: var(--color-text-1);
  border: var(--space-0-125) solid var(--color-glass-border);
  background: var(--color-glass-bg);
}

.et__desc {
  margin-top: var(--space-1);
  color: var(--color-text-1);
}

.et__empathy {
  margin-top: var(--space-2);
  color: var(--color-text-0);
}

.et__intensity {
  margin-top: var(--space-2);
  height: var(--space-0-5);
  border-radius: var(--radius-round);
  background: var(--color-glass-bg);
  border: var(--space-0-125) solid var(--color-glass-border);
  position: relative;
  overflow: hidden;
}

.et__intensity::after {
  content: '';
  position: absolute;
  inset: var(--space-0);
  width: var(--et-intensity);
  background: var(--color-accent-alpha);
}

.et__links {
  margin-top: var(--space-2);
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}

.et__link {
  padding: var(--space-0-5) var(--space-1-5);
  border-radius: var(--radius-round);
  border: var(--space-0-125) solid var(--color-glass-border);
  color: var(--color-text-0);
  transition: background var(--transition-fast), border-color var(--transition-fast);
}

.et__link:hover {
  background: var(--color-glass-bg-hover);
  border-color: var(--color-glass-border-hover);
}

.et__block {
  margin-top: var(--space-2);
}

.et__block--gap {
  margin-top: var(--space-2);
}

.et__block-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.et__block-label {
  color: var(--color-text-0);
  font-size: var(--space-font-size-1);
}

.et__block-actions {
  display: flex;
  gap: var(--space-1);
}

.et__mini {
  padding: var(--space-0-5) var(--space-1-5);
  border-radius: var(--radius-round);
  border: var(--space-0-125) solid var(--color-glass-border);
  background: var(--color-glass-bg);
  color: var(--color-text-1);
  transition: background var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast);
}

.et__mini:hover {
  background: var(--color-glass-bg-hover);
  border-color: var(--color-glass-border-hover);
  color: var(--color-text-0);
}

.et__editable {
  width: var(--space-100p);
  margin-top: var(--space-1);
  padding: var(--space-2);
  border-radius: var(--radius-2);
  border: var(--space-0-125) solid var(--color-glass-border);
  background: var(--color-glass-bg);
  color: var(--color-text-0);
  resize: vertical;
  line-height: var(--space-font-line-height-base);
  transition: border-color var(--transition-base), background var(--transition-base);
}

.et__editable::placeholder {
  color: var(--color-text-2);
}

.et__editable:focus {
  outline: none;
  border-color: var(--color-glass-border-hover);
  background: var(--color-glass-bg-hover);
}

.et__history {
  display: grid;
  gap: var(--space-2);
}

.et__history-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-2);
}

.et__history-empty {
  padding: var(--space-2);
  color: var(--color-text-2);
}

.et__history-list {
  display: grid;
  gap: var(--space-1);
}

.et__history-item {
  padding: var(--space-2);
  text-align: left;
  border-radius: var(--radius-2);
  border: var(--space-0-125) solid var(--color-glass-border);
  background: transparent;
  transition: background var(--transition-fast), border-color var(--transition-fast);
}

.et__history-item:hover {
  background: var(--color-glass-bg);
  border-color: var(--color-glass-border);
}

.et__history-item:active {
  background: var(--color-glass-bg-active);
}

.et__history-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-2);
}

.et__history-mood {
  color: var(--color-text-0);
  font-size: var(--space-font-size-1);
}

.et__history-time {
  color: var(--color-text-2);
  font-size: var(--space-font-size-0);
}

.et__history-preview {
  margin-top: var(--space-1);
  color: var(--color-text-1);
}

</style>
