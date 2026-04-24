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
      <h1 class="home__title">GAIA</h1>
      <p class="home__subtitle">情绪翻译器。把说不清的感受，翻译成更贴近的语言。解释权永远归你。</p>
    </section>

    <section class="home__panel glass glass--surface">
      <div class="home__panel-head">
        <div class="home__panel-title">入口</div>
        <div class="home__hint">Ctrl / ⌘ + Enter 进入翻译</div>
      </div>

      <textarea
        v-model="inputText"
        class="home__textarea"
        placeholder="随便写。可以很乱、可以很短、可以矛盾。"
        @keydown="onKeydown"
      />

      <div v-if="isSafety" class="home__safety glass glass--surface" role="alert">
        <div class="home__safety-title">如果你正在经历强烈的自伤/自杀念头</div>
        <div class="home__safety-desc">请优先联系你身边可信的人，或拨打心理援助热线：400-161-9995。</div>
      </div>

      <div class="home__disclaimer">GAIA 不是心理咨询服务。</div>

      <div class="home__mood">
        <div class="home__mood-head">
          <div class="home__mood-title">此刻更像</div>
          <div class="home__mood-meta">{{ moodLabel }}</div>
        </div>
        <div class="home__mood-desc">{{ moodDesc }}</div>
        <div class="home__mood-tags" role="group" aria-label="情绪选择">
          <button class="home__tag glass glass--interactive" type="button" :class="{ 'is-active': !currentMood }" @click="setMood(null)">
            不设定
          </button>
          <button
            v-for="m in EMOTIONS"
            :key="m.key"
            class="home__tag glass glass--interactive"
            type="button"
            :class="{ 'is-active': currentMood === m.key }"
            @click="setMood(m.key)"
          >
            {{ m.label }}
          </button>
        </div>
      </div>

      <div class="home__actions">
        <button class="home__btn home__btn--accent glass" type="button" @click="goTranslate">进入翻译</button>
        <RouterLink class="home__link glass glass--interactive" :to="buildUrlWithMood('/music', currentMood)">去听同情绪</RouterLink>
        <RouterLink class="home__link glass glass--interactive" :to="buildUrlWithMood('/words', currentMood)">去读同情绪</RouterLink>
        <RouterLink class="home__link glass glass--interactive" :to="buildUrlWithMood('/ai', currentMood)">去生成提示词</RouterLink>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.home {
  display: flex;
  flex-direction: column;
  gap: var(--space-4-5);
  padding-bottom: var(--space-6);
}

.home__hero {
  padding: var(--space-4) var(--space-0);
}

.home__title {
  font-size: var(--space-font-size-6);
  color: var(--color-text-0);
  margin: var(--space-0);
}

.home__subtitle {
  margin: var(--space-1) var(--space-0) var(--space-0);
  max-width: var(--space-layout-subtitle-max-width);
  color: var(--color-text-1);
}

.home__panel {
  padding: var(--space-4-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.home__panel-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-2);
}

.home__panel-title {
  font-size: var(--space-font-size-3);
  color: var(--color-text-0);
}

.home__hint {
  font-size: var(--space-font-size-0);
  color: var(--color-text-2);
}

.home__textarea {
  width: var(--space-100p);
  min-height: calc(var(--space-6) + var(--space-4));
  padding: var(--space-2);
  border-radius: var(--radius-2);
  border: var(--space-0-125) solid var(--color-glass-border);
  background: var(--color-glass-bg);
  color: var(--color-text-0);
  line-height: var(--space-font-line-height-base);
  transition: background var(--transition-base), border-color var(--transition-base);
  resize: vertical;
}

.home__textarea::placeholder {
  color: var(--color-text-2);
}

.home__textarea:focus {
  outline: none;
  background: var(--color-glass-bg-hover);
  border-color: var(--color-glass-border-hover);
}

.home__safety {
  padding: var(--space-2);
}

.home__safety-title {
  color: var(--color-text-0);
  font-size: var(--space-font-size-1);
}

.home__safety-desc {
  margin-top: var(--space-1);
  color: var(--color-text-1);
}

.home__disclaimer {
  color: var(--color-text-2);
  font-size: var(--space-font-size-0);
}

.home__mood {
  padding-top: var(--space-1);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.home__mood-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-2);
}

.home__mood-title {
  color: var(--color-text-0);
  font-size: var(--space-font-size-1);
}

.home__mood-meta {
  color: var(--color-accent);
  font-size: var(--space-font-size-0);
}

.home__mood-desc {
  color: var(--color-text-1);
}

.home__mood-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  margin-top: var(--space-1);
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

.home__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  margin-top: var(--space-2);
}

.home__btn {
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-round);
  color: var(--color-text-0);
  border: var(--space-0-125) solid var(--color-glass-border);
  background: var(--color-glass-bg);
  transition: background var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast);
}

.home__btn:hover {
  background: var(--color-glass-bg-hover);
  border-color: var(--color-glass-border-hover);
}

.home__btn--accent {
  background: var(--color-accent-alpha);
  border-color: var(--color-glass-border-hover);
}

.home__btn--accent:hover {
  background: var(--color-accent-alpha-strong);
  border-color: var(--color-glass-border-hover);
}

.home__btn--accent:active {
  background: var(--color-glass-bg-active);
}

.home__link {
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-round);
  font-size: var(--space-font-size-0);
  color: var(--color-text-0);
  transition: background var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast);
  border: var(--space-0-125) solid var(--color-glass-border);
  background: var(--color-glass-bg);
}

.home__link:hover {
  background: var(--color-glass-bg-hover);
  border-color: var(--color-glass-border-hover);
}

@media (max-width: 860px) {
  .home__panel {
    padding: var(--space-3);
  }
}
</style>
