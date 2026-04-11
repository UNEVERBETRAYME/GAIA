import { EMOTIONS, getEmotionLabel, getEmotionDesc, buildUrlWithMood } from '../emotions.js'
import { translateEmotion, SCENES, TONES } from '../emotion-translator.js'

const STORAGE_KEY = 'gaia_emotion_translate_history_v1'
const HISTORY_LIMIT = 10

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

function buildHistoryItem(entry) {
  const moodLabel = getEmotionLabel(entry?.result?.moodPrimary)
  const preview = (entry?.input || '').trim().slice(0, 24)
  const time = entry?.ts ? new Date(entry.ts).toLocaleString() : ''
  return { moodLabel, preview, time }
}

function setActiveGroup(root, selector, value) {
  root.querySelectorAll(selector).forEach((el) => {
    const v = el.getAttribute('data-value')
    el.classList.toggle('active', v === value)
  })
}

export async function initEmotionTranslatePage() {
  const inputEl = document.getElementById('etInput')
  const sceneWrap = document.getElementById('etScene')
  const toneWrap = document.getElementById('etTone')
  const intensityEl = document.getElementById('etIntensity')
  const intensityVal = document.getElementById('etIntensityVal')
  const submitBtn = document.getElementById('etSubmit')
  const sampleBtn = document.getElementById('etSample')
  const clearBtn = document.getElementById('etClear')
  const saveEntryBtn = document.getElementById('etSaveEntry')
  const safetyEl = document.getElementById('etSafety')

  const outputEmpty = document.getElementById('etOutputEmpty')
  const outputWrap = document.getElementById('etOutput')
  const resultWrap = document.getElementById('etResult')

  const moodPrimaryEl = document.getElementById('etMoodPrimary')
  const moodDescEl = document.getElementById('etMoodDesc')
  const moodSecondaryEl = document.getElementById('etMoodSecondary')
  const empathyEl = document.getElementById('etEmpathy')
  const intensityBar = document.getElementById('etIntensityBar')
  const oneLineEl = document.getElementById('etOneLine')
  const shortEl = document.getElementById('etRewriteShort')
  const longEl = document.getElementById('etRewriteLong')
  const dialogEl = document.getElementById('etRewriteDialog')
  const promptImageEl = document.getElementById('etPromptImage')
  const promptMusicEl = document.getElementById('etPromptMusic')
  const promptWordsEl = document.getElementById('etPromptWords')
  const linkMusic = document.getElementById('etToMusic')
  const linkWords = document.getElementById('etToWords')
  const linkAI = document.getElementById('etToAI')
  const historyEl = document.getElementById('etHistory')
  const historyClear = document.getElementById('etHistoryClear')

  if (!inputEl || !sceneWrap || !toneWrap || !intensityEl || !outputWrap || !resultWrap) return

  let currentEntryId = null
  let currentDraftInput = ''

  let state = {
    scene: 'self',
    tone: 'restrained',
    intensity: 60,
    result: null,
    examples: null,
  }

  function hasSelfHarmRisk(text) {
    const t = String(text || '')
    if (!t) return false
    const keywords = ['自杀', '轻生', '想死', '不想活', '结束生命', '活不下去']
    return keywords.some((k) => t.includes(k))
  }

  function showSafety() {
    if (safetyEl) safetyEl.hidden = false
  }

  function hideSafety() {
    if (safetyEl) safetyEl.hidden = true
  }

  function snapshotEditableTexts() {
    return {
      etOneLine: oneLineEl?.value ?? '',
      etRewriteShort: shortEl?.value ?? '',
      etRewriteLong: longEl?.value ?? '',
      etRewriteDialog: dialogEl?.value ?? '',
      etPromptImage: promptImageEl?.value ?? '',
      etPromptMusic: promptMusicEl?.value ?? '',
      etPromptWords: promptWordsEl?.value ?? '',
    }
  }

  function ensureCurrentEntry() {
    const list = readHistory()
    const idx = currentEntryId ? list.findIndex((x) => x.id === currentEntryId) : -1
    if (idx >= 0) return { list, idx, entry: list[idx] }

    if (!state.result) return { list, idx: -1, entry: null }

    const entry = {
      id: `${Date.now()}`,
      ts: nowISO(),
      input: currentDraftInput,
      result: state.result,
      edits: snapshotEditableTexts(),
    }

    const next = [entry, ...list].slice(0, HISTORY_LIMIT)
    writeHistory(next)
    renderHistory()
    currentEntryId = entry.id
    return { list: next, idx: 0, entry }
  }

  function applyEditsToResult(baseResult, edits) {
    const next = {
      ...baseResult,
      rewrites: { ...(baseResult.rewrites || {}) },
      prompts: { ...(baseResult.prompts || {}) },
    }

    if (!edits) return next

    if (typeof edits.etOneLine === 'string') next.oneLine = edits.etOneLine
    if (typeof edits.etRewriteShort === 'string') next.rewrites.short = edits.etRewriteShort
    if (typeof edits.etRewriteLong === 'string') next.rewrites.long = edits.etRewriteLong
    if (typeof edits.etRewriteDialog === 'string') next.rewrites.dialogue = edits.etRewriteDialog
    if (typeof edits.etPromptImage === 'string') next.prompts.image = edits.etPromptImage
    if (typeof edits.etPromptMusic === 'string') next.prompts.music = edits.etPromptMusic
    if (typeof edits.etPromptWords === 'string') next.prompts.words = edits.etPromptWords

    return next
  }

  function syncIntensityUI() {
    const v = clamp(Number(intensityEl.value || 60), 0, 100)
    intensityEl.value = String(v)
    if (intensityVal) intensityVal.textContent = String(v)
    state.intensity = v
  }

  function renderSecondaryTags(keys) {
    if (!moodSecondaryEl) return
    moodSecondaryEl.innerHTML = ''
    const frag = document.createDocumentFragment()
    ;(keys || []).forEach((k) => {
      const btn = document.createElement('span')
      btn.className = 'glass-tag et-tag'
      btn.textContent = getEmotionLabel(k)
      frag.appendChild(btn)
    })
    moodSecondaryEl.appendChild(frag)
  }

  function renderOutput(result, edits = null) {
    const merged = applyEditsToResult(result, edits)
    state.result = merged
    if (outputEmpty) outputEmpty.hidden = true
    resultWrap.hidden = false

    const moodLabel = getEmotionLabel(merged.moodPrimary)
    const moodDesc = getEmotionDesc(merged.moodPrimary)

    if (moodPrimaryEl) moodPrimaryEl.textContent = moodLabel
    if (moodDescEl) moodDescEl.textContent = moodDesc
    if (empathyEl) empathyEl.textContent = merged.empathy || ''

    if (intensityBar) {
      intensityBar.style.setProperty('--et-intensity', `${clamp(merged.intensity, 0, 100)}%`)
      intensityBar.setAttribute('aria-valuenow', String(clamp(merged.intensity, 0, 100)))
    }

    renderSecondaryTags(merged.moodSecondary)

    if (oneLineEl) oneLineEl.value = merged.oneLine || ''
    if (shortEl) shortEl.value = merged.rewrites?.short || ''
    if (longEl) longEl.value = merged.rewrites?.long || ''
    if (dialogEl) dialogEl.value = merged.rewrites?.dialogue || ''

    if (promptImageEl) promptImageEl.value = merged.prompts?.image || ''
    if (promptMusicEl) promptMusicEl.value = merged.prompts?.music || ''
    if (promptWordsEl) promptWordsEl.value = merged.prompts?.words || ''

    const moodKey = merged.moodPrimary
    if (linkMusic) linkMusic.setAttribute('href', buildUrlWithMood('/pages/music.html', moodKey))
    if (linkWords) linkWords.setAttribute('href', buildUrlWithMood('/pages/words.html', moodKey))
    if (linkAI) linkAI.setAttribute('href', buildUrlWithMood('/pages/ai.html', moodKey))
  }

  function renderHistory() {
    if (!historyEl) return
    const items = readHistory()
    historyEl.innerHTML = ''
    if (items.length === 0) {
      const empty = document.createElement('div')
      empty.className = 'et-history__empty'
      empty.textContent = '这里会保存你最近的翻译记录（仅本地）。'
      historyEl.appendChild(empty)
      return
    }

    const frag = document.createDocumentFragment()
    items.forEach((entry, idx) => {
      const info = buildHistoryItem(entry)
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'glass-card et-history__item'
      btn.dataset.index = String(idx)

      const top = document.createElement('div')
      top.className = 'et-history__top'

      const mood = document.createElement('span')
      mood.className = 'glass-tag et-history__mood'
      mood.textContent = info.moodLabel || '未命名'

      const time = document.createElement('span')
      time.className = 'et-history__time'
      time.textContent = info.time

      top.appendChild(mood)
      top.appendChild(time)

      const text = document.createElement('div')
      text.className = 'et-history__text'
      text.textContent = info.preview ? `${info.preview}${(entry.input || '').length > 24 ? '…' : ''}` : '（空）'

      btn.appendChild(top)
      btn.appendChild(text)
      frag.appendChild(btn)
    })

    historyEl.appendChild(frag)
  }

  function runTranslate() {
    const text = String(inputEl.value || '').trim()
    if (!text) return
    currentDraftInput = text
    hideSafety()
    if (hasSelfHarmRisk(text)) {
      showSafety()
      return
    }
    const result = translateEmotion(text, {
      scene: state.scene,
      tone: state.tone,
      intensity: state.intensity,
    })
    currentEntryId = null
    renderOutput(result)
  }

  async function ensureExamples() {
    if (state.examples) return state.examples
    try {
      const res = await fetch('/data/translation-examples.json', { cache: 'no-store' })
      const json = await res.json()
      state.examples = Array.isArray(json) ? json : []
    } catch {
      state.examples = []
    }
    return state.examples
  }

  async function applyRandomSample() {
    const samples = await ensureExamples()
    const pick = samples[Math.floor(Math.random() * Math.max(samples.length, 1))] || null
    if (!pick) return
    inputEl.value = pick.text || ''

    state.scene = pick.scene in SCENES ? pick.scene : state.scene
    state.tone = pick.tone in TONES ? pick.tone : state.tone
    intensityEl.value = String(clamp(Number(pick.intensity ?? state.intensity), 0, 100))
    syncIntensityUI()

    setActiveGroup(sceneWrap, '.et-chip[data-value]', state.scene)
    setActiveGroup(toneWrap, '.et-chip[data-value]', state.tone)

    runTranslate()
    inputEl.focus()
  }

  function clearAll() {
    inputEl.value = ''
    if (outputEmpty) outputEmpty.hidden = false
    resultWrap.hidden = true
    state.result = null
    currentEntryId = null
    currentDraftInput = ''
    hideSafety()
  }

  function onSceneClick(e) {
    const btn = e.target.closest('.et-chip[data-value]')
    if (!btn) return
    const v = btn.getAttribute('data-value')
    if (!(v in SCENES)) return
    state.scene = v
    setActiveGroup(sceneWrap, '.et-chip[data-value]', v)
  }

  function onToneClick(e) {
    const btn = e.target.closest('.et-chip[data-value]')
    if (!btn) return
    const v = btn.getAttribute('data-value')
    if (!(v in TONES)) return
    state.tone = v
    setActiveGroup(toneWrap, '.et-chip[data-value]', v)
  }

  function onIntensityInput() {
    syncIntensityUI()
  }

  function onSubmit() {
    runTranslate()
  }

  async function onCopyClick(e) {
    const btn = e.target.closest('[data-copy-target]')
    if (!btn) return
    const targetId = btn.getAttribute('data-copy-target')
    if (!targetId) return
    const el = document.getElementById(targetId)
    if (!el) return
    const ok = await copyText('value' in el ? el.value : el.textContent)
    btn.classList.toggle('is-copied', ok)
    if (ok) setTimeout(() => btn.classList.remove('is-copied'), 900)
  }

  function onSaveClick(e) {
    const btn = e.target.closest('[data-save-target]')
    if (!btn) return
    const targetId = btn.getAttribute('data-save-target')
    if (!targetId) return
    const el = document.getElementById(targetId)
    if (!el) return

    const ensured = ensureCurrentEntry()
    const list = ensured.list
    const entry = ensured.entry
    const idx = ensured.idx
    if (!entry) return

    entry.edits = entry.edits && typeof entry.edits === 'object' ? entry.edits : {}
    entry.edits[targetId] = 'value' in el ? el.value : el.textContent

    if (idx >= 0) list[idx] = entry
    writeHistory(list)

    btn.classList.add('is-saved')
    setTimeout(() => btn.classList.remove('is-saved'), 900)
  }

  function onSaveEntry() {
    const ensured = ensureCurrentEntry()
    if (!ensured.entry || !saveEntryBtn) return
    saveEntryBtn.classList.add('is-saved')
    setTimeout(() => saveEntryBtn.classList.remove('is-saved'), 900)
  }

  function onHistoryClick(e) {
    const btn = e.target.closest('.et-history__item[data-index]')
    if (!btn) return
    const idx = Number(btn.dataset.index)
    const list = readHistory()
    const entry = list[idx]
    if (!entry) return
    currentEntryId = entry.id
    inputEl.value = entry.input || ''
    state.scene = entry.result?.scene || state.scene
    state.tone = entry.result?.tone || state.tone
    intensityEl.value = String(clamp(Number(entry.result?.intensity ?? state.intensity), 0, 100))
    syncIntensityUI()
    setActiveGroup(sceneWrap, '.et-chip[data-value]', state.scene)
    setActiveGroup(toneWrap, '.et-chip[data-value]', state.tone)
    renderOutput(entry.result, entry.edits)
    inputEl.focus()
  }

  function onHistoryClear() {
    window.localStorage.removeItem(STORAGE_KEY)
    renderHistory()
  }

  function onKeyDown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      runTranslate()
    }
  }

  sceneWrap.addEventListener('click', onSceneClick)
  toneWrap.addEventListener('click', onToneClick)
  intensityEl.addEventListener('input', onIntensityInput)
  submitBtn?.addEventListener('click', onSubmit)
  sampleBtn?.addEventListener('click', applyRandomSample)
  clearBtn?.addEventListener('click', clearAll)
  saveEntryBtn?.addEventListener('click', onSaveEntry)
  outputWrap.addEventListener('click', onCopyClick)
  outputWrap.addEventListener('click', onSaveClick)
  historyEl?.addEventListener('click', onHistoryClick)
  historyClear?.addEventListener('click', onHistoryClear)
  inputEl.addEventListener('keydown', onKeyDown)

  setActiveGroup(sceneWrap, '.et-chip[data-value]', state.scene)
  setActiveGroup(toneWrap, '.et-chip[data-value]', state.tone)
  syncIntensityUI()
  renderHistory()

  if (outputEmpty) outputEmpty.hidden = false
  resultWrap.hidden = true

  return () => {
    sceneWrap.removeEventListener('click', onSceneClick)
    toneWrap.removeEventListener('click', onToneClick)
    intensityEl.removeEventListener('input', onIntensityInput)
    submitBtn?.removeEventListener('click', onSubmit)
    sampleBtn?.removeEventListener('click', applyRandomSample)
    clearBtn?.removeEventListener('click', clearAll)
    saveEntryBtn?.removeEventListener('click', onSaveEntry)
    outputWrap.removeEventListener('click', onCopyClick)
    outputWrap.removeEventListener('click', onSaveClick)
    historyEl?.removeEventListener('click', onHistoryClick)
    historyClear?.removeEventListener('click', onHistoryClear)
    inputEl.removeEventListener('keydown', onKeyDown)
  }
}
