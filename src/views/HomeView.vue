<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { EMOTIONS, buildQueryWithMood, buildUrlWithMood, getEmotionDesc, getEmotionLabel, readEmotionFromQuery } from '../../js/emotions.js'
import { hasSelfHarmRisk } from '../../js/emotion-translator.js'

const route = useRoute()
const router = useRouter()

const inputText = ref('')
const currentMood = ref(null)
const isSafety = ref(false)

const moodLabel = computed(() => (currentMood.value ? getEmotionLabel(currentMood.value) : '不设定'))
const moodDesc = computed(() =>
  currentMood.value ? getEmotionDesc(currentMood.value) : '你可以先不选。先把那句说不清的感觉放在这里。'
)

function syncMoodFromRoute() {
  currentMood.value = readEmotionFromQuery(route.query)
}

function setMood(nextMood) {
  router.replace({ query: buildQueryWithMood(route.query, nextMood) })
}

function goTranslate() {
  const raw = String(inputText.value || '').trim()
  if (!raw) {
    router.push(buildUrlWithMood('/translate', currentMood.value))
    return
  }

  if (hasSelfHarmRisk(raw)) {
    isSafety.value = true
    return
  }

  isSafety.value = false
  const base = buildUrlWithMood('/translate', currentMood.value)
  const u = new URL(base, window.location.origin)
  u.searchParams.set('text', raw)
  router.push(u.pathname + u.search + u.hash)
}

function onKeydown(e) {
  const isEnter = e.key === 'Enter'
  if (!isEnter) return
  if (!(e.ctrlKey || e.metaKey)) return
  e.preventDefault()
  goTranslate()
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
  <div class="home">
    <section class="home__hero">
      <div class="home__badge glass glass--liquid">深夜角落</div>
      <h1 class="home__title">GAIA</h1>
      <p class="home__subtitle">一个人的深夜角落。情绪、文字、音乐，和一个不会离开的人。</p>
    </section>

    <section class="home__input-zone">
      <textarea
        v-model="inputText"
        class="home__textarea"
        placeholder="随便写。可以很乱、可以很短、可以矛盾。"
        @keydown="onKeydown"
      />
      <div v-if="isSafety" class="home__safety glass glass--liquid" role="alert">
        <div class="home__safety-title">如果你正在经历强烈的自伤/自杀念头</div>
        <div class="home__safety-desc">请优先联系你身边可信的人，或拨打心理援助热线：400-161-9995。</div>
      </div>
      <div class="home__input-row">
        <div class="home__hint">Ctrl / ⌘ + Enter 进入翻译</div>
        <button class="home__cta glass glass--btn home__btn--accent" type="button" @click="goTranslate">进入翻译</button>
      </div>
    </section>

    <section class="home__mood">
      <div class="home__mood-label">此刻更像</div>
      <div class="home__mood-tags">
        <button class="home__tag glass glass--interactive" type="button" :class="{ 'is-active': !currentMood }" @click="setMood(null)">不设定</button>
        <button v-for="m in EMOTIONS" :key="m.key" class="home__tag glass glass--interactive" type="button" :class="{ 'is-active': currentMood === m.key }" @click="setMood(m.key)">{{ m.label }}</button>
      </div>
      <div class="home__mood-desc">{{ moodDesc }}</div>
    </section>

    <section class="home__entrances">
      <RouterLink class="home__card glass glass--liquid" :to="buildUrlWithMood('/ai', currentMood)">
        <span class="home__card-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
        </span>
        <span class="home__card-label">跟她说说话</span>
        <span class="home__card-arrow">→</span>
      </RouterLink>
      <RouterLink class="home__card glass glass--liquid" :to="buildUrlWithMood('/translate', currentMood)">
        <span class="home__card-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </span>
        <span class="home__card-label">把感受拆开</span>
        <span class="home__card-arrow">→</span>
      </RouterLink>
      <RouterLink class="home__card glass glass--liquid" :to="buildUrlWithMood('/words', currentMood)">
        <span class="home__card-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
        </span>
        <span class="home__card-label">被接住的瞬间</span>
        <span class="home__card-arrow">→</span>
      </RouterLink>
      <RouterLink class="home__card glass glass--liquid" :to="buildUrlWithMood('/music', currentMood)">
        <span class="home__card-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
        </span>
        <span class="home__card-label">找到对的旋律</span>
        <span class="home__card-arrow">→</span>
      </RouterLink>
    </section>

    <div class="home__disclaimer">GAIA 不是心理咨询服务</div>
  </div>
</template>

<style scoped lang="scss">
.home {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-5);
  padding: var(--space-4) var(--space-3) var(--space-6);
}

.home__hero {
  text-align: center;
  padding-top: var(--space-5);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
}

.home__badge {
  display: inline-flex;
  align-items: center;
  padding: var(--space-0-5) var(--space-1-5);
  font-size: var(--space-font-size-0);
  color: var(--color-text-2);
  letter-spacing: 0.06em;
  margin-bottom: var(--space-1);
}

.home__title {
  font-family: 'Instrument Serif', serif;
  font-style: italic;
  font-weight: 300;
  font-size: clamp(3rem, 8vw, 6rem);
  letter-spacing: -0.03em;
  color: var(--color-text-0);
  margin: 0;
  line-height: 1;
}

.home__subtitle {
  max-width: 600px;
  color: var(--color-text-2);
  font-size: var(--space-font-size-1);
  line-height: 1.7;
  letter-spacing: 0.04em;
  margin: 0;
}

.home__input-zone {
  width: 100%;
  max-width: 680px;
  display: flex;
  flex-direction: column;
  gap: var(--space-1-5);
}

.home__textarea {
  width: 100%;
  min-height: 100px;
  padding: var(--space-1-5);
  border-radius: var(--radius-2);
  border: none;
  background: rgba(255, 255, 255, 0.02);
  color: var(--color-text-0);
  line-height: var(--space-font-line-height-base);
  font-size: var(--space-font-size-1);
  font-family: inherit;
  resize: vertical;
  outline: none;
  position: relative;
}

.home__textarea::placeholder {
  color: var(--color-text-2);
}

.home__textarea:focus {
  background: rgba(255, 255, 255, 0.04);
}

.home__input-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.home__hint {
  font-size: var(--space-font-size-0);
  color: var(--color-text-2);
  opacity: 0.6;
}

.home__cta {
  flex-shrink: 0;
}

.home__safety {
  padding: var(--space-2);
}

.home__safety-title {
  color: var(--color-text-0);
  font-size: var(--space-font-size-1);
}

.home__safety-desc {
  margin-top: var(--space-0-5);
  color: var(--color-text-1);
  font-size: var(--space-font-size-0);
}

.home__mood {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  text-align: center;
}

.home__mood-label {
  color: var(--color-text-2);
  font-size: var(--space-font-size-1);
  letter-spacing: 0.04em;
}

.home__mood-desc {
  color: var(--color-text-2);
  font-size: var(--space-font-size-0);
  opacity: 0.6;
}

.home__mood-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-1);
}

.home__tag {
  padding: var(--space-0-5) var(--space-1-5);
  border-radius: var(--radius-round);
  font-size: var(--space-font-size-0);
  color: var(--color-text-1);
  transition: background var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast);
}

.home__tag:hover {
  background: var(--color-glass-bg-hover);
  border-color: var(--color-glass-border-hover);
  color: var(--color-text-0);
}

.home__tag.is-active {
  color: var(--color-text-0);
  border-color: var(--color-glass-border-hover);
  background: var(--color-accent-alpha);
}

.home__entrances {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-2);
  width: 100%;
  max-width: 960px;
}

.home__card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-2);
  padding: var(--space-2);
  min-height: 160px;
  text-decoration: none;
  transition: transform var(--transition-base), box-shadow var(--transition-base);
}

.home__card:hover {
  transform: translateY(-2px);
}

.home__card-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-accent);
  opacity: 0.7;
}

.home__card-label {
  color: var(--color-text-0);
  font-size: var(--space-font-size-1);
  font-weight: 400;
  letter-spacing: 0.03em;
}

.home__card-arrow {
  margin-top: auto;
  color: var(--color-text-2);
  font-size: var(--space-font-size-2);
  opacity: 0;
  transform: translateX(-4px);
  transition: opacity var(--transition-fast), transform var(--transition-fast);
}

.home__card:hover .home__card-arrow {
  opacity: 0.6;
  transform: translateX(0);
}

.home__btn--accent {
  background: var(--color-accent-alpha);
}

.home__btn--accent:hover {
  background: var(--color-accent-alpha-strong);
}

.home__disclaimer {
  text-align: center;
  color: var(--color-text-2);
  font-size: var(--space-font-size-0);
  opacity: 0.4;
  padding-top: var(--space-3);
}

@media (max-width: 860px) {
  .home__entrances {
    grid-template-columns: repeat(2, 1fr);
  }

  .home__title {
    font-size: clamp(2.5rem, 10vw, 4rem);
  }
}

@media (max-width: 480px) {
  .home__entrances {
    grid-template-columns: 1fr;
  }
}
</style>
