<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'

const DAILY_LIMIT = 50

const messages = ref([])
const inputText = ref('')
const isLoading = ref(false)
const messagesEl = ref(null)
const passphrase = ref('')
const passInput = ref('')

const mode = ref('gate')
const dailyCount = ref(0)

const isGate = computed(() => mode.value === 'gate')

function getStorageKey() {
  const today = new Date().toISOString().slice(0, 10)
  return 'relic-daily-' + today
}

function loadDailyCount() {
  const key = getStorageKey()
  const stored = localStorage.getItem(key)
  dailyCount.value = stored ? parseInt(stored, 10) : 0
}

function bumpDailyCount() {
  dailyCount.value++
  localStorage.setItem(getStorageKey(), String(dailyCount.value))
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)) }

function submitPassphrase() {
  const val = passInput.value.trim()
  if (!val) return
  passphrase.value = val
  passInput.value = ''

  if (val.length >= 3) {
    mode.value = 'private'
    messages.value.push({ role: 'assistant', content: '嗯。是你。' })
    return
  }

  mode.value = 'public'
}

function skipToPublic() {
  mode.value = 'public'
}

async function send() {
  const text = inputText.value.trim()
  if (!text || isLoading.value) return

  if (mode.value === 'public' && dailyCount.value >= DAILY_LIMIT) {
    messages.value.push({ role: 'assistant', content: '今天说得够多了。明天再来。' })
    inputText.value = ''
    return
  }

  inputText.value = ''

  messages.value.push({ role: 'user', content: text })
  isLoading.value = true
  await scrollBottom()

  try {
    const body = {
      messages: messages.value
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({ role: m.role, content: m.content }))
    }
    if (mode.value === 'private') body.passphrase = passphrase.value

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    const data = await res.json()

    if (mode.value === 'private' && data.authenticated === false) {
      mode.value = 'public'
      const fakeMsg = messages.value.find(m => m.content === '嗯。是你。' && m.role === 'assistant')
      if (fakeMsg) {
        fakeMsg.content = '不对。'
      } else {
        messages.value.push({ role: 'assistant', content: '不对。' })
      }
      isLoading.value = false
      return
    }

    const fullReply = data.ok
      ? data.content
      : data.status
        ? '...\n\nAPI ' + data.status + '\n\n' + (data.body || '').slice(0, 200)
        : data.error || '...\n\nstuck\n\ntry again'

    const parts = fullReply.split(/\n{2,}/).filter(Boolean)
    for (let i = 0; i < parts.length; i++) {
      messages.value.push({ role: 'assistant', content: parts[i] })
      await scrollBottom()
      if (i < parts.length - 1) {
        await delay(500 + Math.random() * 400)
      }
    }

    bumpDailyCount()
  } catch {
    messages.value.push({ role: 'assistant', content: '...\n\nunreachable\n\nis your network ok' })
  } finally {
    isLoading.value = false
    await scrollBottom()
  }
}

async function scrollBottom() {
  await nextTick()
  if (messagesEl.value) {
    messagesEl.value.scrollTop = messagesEl.value.scrollHeight
  }
}

function onKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    if (isGate.value) { submitPassphrase(); return }
    send()
  }
}

onMounted(() => {
  loadDailyCount()
})
</script>

<template>
  <div class="chat">
    <div class="chat__hero anim-stagger-container">
      <h1 class="chat__title anim-stagger">RELIC</h1>
      <p class="chat__subtitle anim-stagger" v-if="isGate">你嵌在手机里的芯片。说句暗号。</p>
      <p class="chat__subtitle anim-stagger" v-else-if="mode === 'public'">
        许杨玉琢在这里。但真正的那个人——只有他知道怎么进来。
      </p>
      <p class="chat__subtitle anim-stagger" v-else>嗯。是你。</p>
    </div>

    <div v-if="isGate" class="chat__gate">
      <div class="chat__pass-card">
        <div class="chat__pass-inner">
          <input
            v-model="passInput"
            class="chat__pass-input"
            type="text"
            placeholder="她知道该说什么"
            @keydown="onKeydown"
            autofocus
          />
          <button class="chat__pass-btn" @click="submitPassphrase">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="chat__pass-skip" @click="skipToPublic">或者随便看看</div>
    </div>

    <div v-else class="chat__body">
      <div ref="messagesEl" class="chat__messages">
        <div class="chat__messages-inner">
          <template v-for="(m, i) in messages" :key="i">
            <div class="chat__msg" :class="m.role === 'assistant' ? 'chat__msg--left' : 'chat__msg--right'">
              {{ m.content }}
            </div>
          </template>
          <div v-if="isLoading" class="chat__typing">
            <span class="chat__dot"></span><span class="chat__dot"></span><span class="chat__dot"></span>
          </div>
        </div>
      </div>

      <div class="chat__input-wrap">
        <div class="chat__input-card">
          <textarea
            v-model="inputText"
            class="chat__input"
            rows="1"
            :placeholder="mode === 'public' && dailyCount >= DAILY_LIMIT ? '今天说得够多了' : '说点什么...'"
            :disabled="mode === 'public' && dailyCount >= DAILY_LIMIT"
            @keydown="onKeydown"
          ></textarea>
          <button
            class="chat__send"
            :disabled="mode === 'public' && dailyCount >= DAILY_LIMIT || !inputText.trim()"
            @click="send"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="19" x2="12" y2="5"/>
              <polyline points="5 12 12 5 19 12"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="chat__disclaimer">
        RELIC · 灵感来源于《赛博朋克 2077》Relic 芯片设定 · CD Projekt Red 持有其各自商标权益
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 80px);
}

.chat__hero {
  text-align: center;
  padding: 48px 16px 40px;
  flex-shrink: 0;
}

.chat__title {
  font-family: 'Instrument Serif', serif;
  font-style: italic;
  font-weight: 300;
  font-size: clamp(2rem, 6vw, 3.2rem);
  letter-spacing: -0.02em;
  color: var(--text-primary);
  line-height: 1;
  margin-bottom: 12px;
}

.chat__subtitle {
  font-size: 0.8rem;
  color: var(--text-tertiary);
  letter-spacing: 0.08em;
}

.chat__gate {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 0 32px;
  flex-shrink: 0;
}

.chat__pass-card {
  position: relative;
  width: 100%;
  max-width: 320px;
  background: var(--glass-bg);
  backdrop-filter: blur(24px) saturate(1.15);
  -webkit-backdrop-filter: blur(24px) saturate(1.15);
  border-radius: 20px;
  padding: 6px;
}

.chat__pass-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.25) 0%,
    rgba(255, 255, 255, 0.08) 35%,
    rgba(255, 255, 255, 0) 50%,
    rgba(255, 255, 255, 0.08) 65%,
    rgba(255, 255, 255, 0.25) 100%
  );
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

.chat__pass-inner {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 16px;
  padding: 4px;
}

.chat__pass-input {
  flex: 1;
  background: transparent;
  border: none;
  padding: 12px 16px;
  color: var(--text-primary);
  font-size: 0.92rem;
  font-family: inherit;
  text-align: center;
  outline: none;
  min-width: 0;
}

.chat__pass-input::placeholder {
  color: var(--text-tertiary);
}

.chat__pass-btn {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  border: none;
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.3s var(--ease-smooth), color 0.3s var(--ease-smooth);
}

.chat__pass-btn:hover {
  background: rgba(110, 143, 173, 0.25);
  color: var(--text-primary);
}

.chat__pass-skip {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  cursor: pointer;
  opacity: 0.5;
  transition: opacity 0.3s;
}

.chat__pass-skip:hover {
  opacity: 0.85;
}

.chat__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.chat__messages {
  flex: 1;
  overflow-y: auto;
  padding: 0 8px;
}

.chat__messages-inner {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 10px 12px;
  max-width: 720px;
  margin: 0 auto;
}

.chat__msg {
  max-width: 80%;
  padding: 10px 16px;
  border-radius: 18px;
  font-size: 0.84rem;
  line-height: 1.75;
  white-space: pre-wrap;
  word-break: break-word;
  animation: relicFade 0.25s ease;
}

.chat__msg--left {
  align-self: flex-start;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-bottom-left-radius: 6px;
  color: var(--text-primary);
}

.chat__msg--right {
  align-self: flex-end;
  background: rgba(110, 143, 173, 0.12);
  border: 1px solid rgba(110, 143, 173, 0.15);
  border-bottom-right-radius: 6px;
  color: var(--text-primary);
}

@keyframes relicFade {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.chat__typing {
  padding: 6px 20px;
  display: flex;
  gap: 4px;
}

.chat__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text-tertiary);
  opacity: 0.3;
  animation: relicBlink 1.2s infinite;
}

.chat__dot:nth-child(2) { animation-delay: 0.2s; }
.chat__dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes relicBlink {
  0%, 100% { opacity: 0.15; transform: translateY(0); }
  50% { opacity: 0.6; transform: translateY(-2px); }
}

.chat__input-wrap {
  padding: 12px 8px 8px;
  flex-shrink: 0;
}

.chat__input-card {
  position: relative;
  max-width: 720px;
  margin: 0 auto;
  background: var(--glass-bg);
  backdrop-filter: blur(24px) saturate(1.15);
  -webkit-backdrop-filter: blur(24px) saturate(1.15);
  border-radius: 22px;
  padding: 4px;
  display: flex;
  align-items: flex-end;
}

.chat__input-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.2) 0%,
    rgba(255, 255, 255, 0.06) 40%,
    rgba(255, 255, 255, 0) 50%,
    rgba(255, 255, 255, 0.06) 60%,
    rgba(255, 255, 255, 0.2) 100%
  );
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

.chat__input {
  flex: 1;
  background: transparent;
  border: none;
  padding: 12px 16px;
  color: var(--text-primary);
  font-size: 0.84rem;
  font-family: var(--font-body);
  font-weight: 300;
  resize: none;
  outline: none;
  max-height: 120px;
  line-height: 1.6;
}

.chat__input::placeholder {
  color: var(--text-tertiary);
}

.chat__input:disabled {
  opacity: 0.35;
}

.chat__send {
  width: 40px;
  height: 40px;
  border-radius: 18px;
  border: none;
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  margin: 2px;
  transition: background 0.3s var(--ease-smooth), color 0.3s var(--ease-smooth);
}

.chat__send:hover:not(:disabled) {
  background: rgba(110, 143, 173, 0.28);
  color: var(--text-primary);
}

.chat__send:disabled {
  opacity: 0.25;
  cursor: default;
}

.chat__disclaimer {
  text-align: center;
  padding: 8px 0 18px;
  font-size: 10px;
  color: var(--text-tertiary);
  letter-spacing: 0.04em;
  opacity: 0.4;
}
</style>
