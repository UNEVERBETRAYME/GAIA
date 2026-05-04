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
    <div class="chat__hero">
      <h1 class="chat__title">RELIC</h1>
      <p class="chat__subtitle" v-if="isGate">你嵌在手机里的芯片。说句暗号。</p>
      <p class="chat__subtitle" v-else-if="mode === 'public'">
        许杨玉琢在这里。但真正的那个人——只有他知道怎么进来。
      </p>
      <p class="chat__subtitle" v-else>嗯。是你。</p>
    </div>

    <div v-if="isGate" class="chat__gate">
      <input
        v-model="passInput"
        class="chat__pass-input"
        type="text"
        placeholder="她知道该说什么"
        @keydown="onKeydown"
        autofocus
      />
      <button class="chat__pass-btn glass glass--interactive" @click="submitPassphrase">→</button>
      <div class="chat__pass-skip" @click="skipToPublic">或者随便看看</div>
    </div>

    <template v-else>
      <div ref="messagesEl" class="chat__messages">
        <template v-for="(m, i) in messages" :key="i">
          <div class="chat__msg" :class="m.role === 'assistant' ? 'chat__msg--left' : 'chat__msg--right'">
            {{ m.content }}
          </div>
        </template>
        <div v-if="isLoading" class="chat__typing">
          <span class="chat__dot"></span><span class="chat__dot"></span><span class="chat__dot"></span>
        </div>
      </div>

      <div class="chat__input-area">
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
          :disabled="mode === 'public' && dailyCount >= DAILY_LIMIT"
          @click="send"
        >↑</button>
      </div>
      <div class="chat__disclaimer">
        RELIC · 灵感来源于《赛博朋克 2077》Relic 芯片设定 · CD Projekt Red 持有其各自商标权益
      </div>
    </template>
  </div>
</template>

<style scoped>
.chat { display: flex; flex-direction: column; height: calc(100vh - 72px); padding: 0 }

.chat__hero { text-align: center; padding: 28px 16px 32px; flex-shrink: 0 }
.chat__title {
  font-family: var(--font-en), var(--font-cn), sans-serif;
  font-weight: var(--font-weight);
  font-size: clamp(1.4rem, 4vw, 2rem);
  letter-spacing: var(--ls-hero);
  color: var(--text-primary);
}
.chat__subtitle { margin-top: 4px; font-size: 0.82rem; color: var(--text-secondary); letter-spacing: 0.06em }

.chat__gate { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 0 32px 20px; flex-shrink: 0 }
.chat__pass-input {
  width: 100%; max-width: 280px;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm);
  padding: 14px 18px;
  color: var(--text-primary);
  font-size: 0.92rem;
  font-family: inherit;
  text-align: center;
  outline: none;
  min-height: 48px;
}
.chat__pass-input:focus { border-color: var(--accent-fog-blue); }
.chat__pass-input::placeholder { color: var(--text-tertiary); }
.chat__pass-btn { padding: 8px 24px; cursor: pointer; font-size: 1rem }
.chat__pass-skip { font-size: 0.78rem; color: var(--text-tertiary); cursor: pointer; margin-top: 4px; opacity: 0.6 }
.chat__pass-skip:hover { opacity: 1 }

.chat__messages { flex: 1; overflow-y: auto; padding: 6px 18px 4px; display: flex; flex-direction: column; gap: 3px }
.chat__msg {
  max-width: 86%; padding: 9px 14px; border-radius: 16px;
  font-size: 0.88rem; line-height: 1.8;
  white-space: pre-wrap; word-break: break-word;
  animation: relicFade 0.2s ease;
}
.chat__msg--left {
  align-self: flex-start;
  background: var(--glass-bg);
  border-bottom-left-radius: 6px;
  border: 1px solid var(--glass-border);
}
.chat__msg--right {
  align-self: flex-end;
  background: var(--glass-bg-hover);
  border-bottom-right-radius: 6px;
  border: 1px solid var(--glass-border);
}
@keyframes relicFade { from { opacity: 0; transform: translateY(4px) } to { opacity: 1; transform: translateY(0) } }

.chat__typing { padding: 4px 20px }
.chat__dot {
  display: inline-block; width: 5px; height: 5px; border-radius: 50%;
  background: var(--text-tertiary); opacity: 0.4; margin-right: 3px;
  animation: relicBlink 1.2s infinite;
}
.chat__dot:nth-child(2) { animation-delay: 0.2s }
.chat__dot:nth-child(3) { animation-delay: 0.4s }
@keyframes relicBlink { 0%,100% { opacity: 0.2 } 50% { opacity: 0.7 } }

.chat__input-area {
  display: flex; align-items: flex-end; gap: 8px;
  padding: 12px 16px 16px;
  border-top: 1px solid var(--glass-border);
}
.chat__input {
  flex: 1;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 18px;
  padding: 10px 16px;
  color: var(--text-primary);
  font-size: 0.88rem; font-family: inherit;
  resize: none; outline: none; max-height: 100px;
}
.chat__input:focus { border-color: var(--accent-fog-blue); }
.chat__input::placeholder { color: var(--text-tertiary); }
.chat__input:disabled { opacity: 0.4 }
.chat__send {
  width: 38px; height: 38px; border-radius: 50%;
  border: 1px solid var(--glass-border);
  background: var(--glass-bg-hover);
  color: var(--text-secondary);
  font-size: 16px; cursor: pointer; flex-shrink: 0;
  transition: background 0.3s var(--ease-smooth);
}
.chat__send:hover { background: var(--accent-fog-blue-alpha); color: var(--text-primary); }
.chat__send:disabled { opacity: 0.3; cursor: default }
.chat__disclaimer {
  text-align: center; padding: 4px 0 10px;
  font-size: 10px; color: var(--text-tertiary);
  letter-spacing: 0.04em; opacity: 0.5;
}
</style>
