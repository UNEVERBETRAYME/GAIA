const EMOTIONS = [
  {
    key: 'melancholy',
    label: '忧郁',
    desc: '像雨停后的路面，潮湿但不喧哗。',
  },
  {
    key: 'calm',
    label: '平静',
    desc: '把呼吸放慢，让世界暂时离远一点。',
  },
  {
    key: 'healing',
    label: '治愈',
    desc: '把刺放下，让心慢慢复原。',
  },
  {
    key: 'lonely',
    label: '孤独',
    desc: '不是缺少人，而是缺少被真正理解的瞬间。',
  },
]

const EMOTION_MAP = new Map(EMOTIONS.map((e) => [e.key, e]))

function normalizeEmotionKey(key) {
  const raw = (key || '').trim().toLowerCase()
  return EMOTION_MAP.has(raw) ? raw : null
}

function getEmotionLabel(key) {
  const k = normalizeEmotionKey(key)
  return k ? EMOTION_MAP.get(k).label : ''
}

function getEmotionDesc(key) {
  const k = normalizeEmotionKey(key)
  return k ? EMOTION_MAP.get(k).desc : ''
}

function readEmotionFromUrl(url = window.location.href) {
  try {
    const u = new URL(url, window.location.origin)
    return normalizeEmotionKey(u.searchParams.get('mood'))
  } catch {
    return null
  }
}

function buildUrlWithMood(pathname, moodKey) {
  const k = normalizeEmotionKey(moodKey)
  const u = new URL(pathname, window.location.origin)
  if (k) {
    u.searchParams.set('mood', k)
  } else {
    u.searchParams.delete('mood')
  }
  return u.pathname + u.search + u.hash
}

function replaceMoodInCurrentUrl(moodKey) {
  const u = new URL(window.location.href)
  const k = normalizeEmotionKey(moodKey)
  if (k) {
    u.searchParams.set('mood', k)
  } else {
    u.searchParams.delete('mood')
  }
  window.history.replaceState({}, '', u.pathname + u.search + u.hash)
}

export {
  EMOTIONS,
  normalizeEmotionKey,
  getEmotionLabel,
  getEmotionDesc,
  readEmotionFromUrl,
  buildUrlWithMood,
  replaceMoodInCurrentUrl,
}

