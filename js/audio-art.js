import jsmediatags from 'jsmediatags/dist/jsmediatags.min.js'

const artCache = new Map()
const pending = new Map()
const MISS_KEY = 'gaia-audio-art-miss-v1'

let missSet = null

function loadMissSet() {
  if (missSet) return missSet
  try {
    const raw = localStorage.getItem(MISS_KEY)
    if (!raw) {
      missSet = new Set()
      return missSet
    }
    const arr = JSON.parse(raw)
    missSet = new Set(Array.isArray(arr) ? arr : [])
  } catch {
    missSet = new Set()
  }
  return missSet
}

function saveMissSet() {
  try {
    localStorage.setItem(MISS_KEY, JSON.stringify(Array.from(loadMissSet()).slice(-200)))
  } catch {}
}

function bufferToDataUrl(picture) {
  if (!picture || !picture.data || !picture.format) return null
  const bytes = new Uint8Array(picture.data)
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return `data:${picture.format};base64,${btoa(binary)}`
}

function parseTags(src) {
  return new Promise((resolve, reject) => {
    jsmediatags.read(src, {
      onSuccess: (tag) => resolve(tag),
      onError: (err) => reject(err),
    })
  })
}

export async function getAudioArt(src) {
  if (!src) return null
  if (artCache.has(src)) return artCache.get(src)

  const misses = loadMissSet()
  if (misses.has(src)) return null

  if (pending.has(src)) {
    return pending.get(src)
  }

  const job = parseTags(src)
    .then((tag) => {
      const picture = tag?.tags?.picture
      const dataUrl = bufferToDataUrl(picture)
      if (!dataUrl) {
        misses.add(src)
        saveMissSet()
        artCache.set(src, null)
        return null
      }
      artCache.set(src, dataUrl)
      return dataUrl
    })
    .catch(() => {
      misses.add(src)
      saveMissSet()
      artCache.set(src, null)
      return null
    })
    .finally(() => {
      pending.delete(src)
    })

  pending.set(src, job)
  return job
}
