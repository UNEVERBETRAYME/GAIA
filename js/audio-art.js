import jsmediatags from 'jsmediatags/dist/jsmediatags.min.js'

// 完整 ID3 信息缓存（包括 title/artist/coverUrl）
const id3Cache = new Map()
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

/**
 * 获取音频的完整 ID3 信息（懒加载）
 * @param {string} src - 音频文件路径
 * @returns {Promise<Object|null>} { title, artist, coverUrl } 或 null
 */
export async function getAudioMetadata(src) {
  if (!src) return null

  // 返回缓存
  if (id3Cache.has(src)) return id3Cache.get(src)

  const misses = loadMissSet()
  if (misses.has(src)) return null

  // 防止重复请求
  if (pending.has(src)) {
    return pending.get(src)
  }

  const job = parseTags(src)
    .then((tag) => {
      const tags = tag?.tags
      if (!tags) {
        misses.add(src)
        saveMissSet()
        id3Cache.set(src, null)
        return null
      }

      const metadata = {
        title: tags.title || null,
        artist: tags.artist || null,
        coverUrl: null
      }

      // 解析封面
      const picture = tags.picture
      if (picture) {
        metadata.coverUrl = bufferToDataUrl(picture)
      }

      // 如果完全没有有用信息，标记为 miss
      if (!metadata.title && !metadata.artist && !metadata.coverUrl) {
        misses.add(src)
        saveMissSet()
        id3Cache.set(src, null)
        return null
      }

      id3Cache.set(src, metadata)
      return metadata
    })
    .catch(() => {
      misses.add(src)
      saveMissSet()
      id3Cache.set(src, null)
      return null
    })
    .finally(() => {
      pending.delete(src)
    })

  pending.set(src, job)
  return job
}

/**
 * 仅获取封面（向后兼容）
 * @param {string} src - 音频文件路径
 * @returns {Promise<string|null>} coverUrl 或 null
 */
export async function getAudioArt(src) {
  const metadata = await getAudioMetadata(src)
  return metadata?.coverUrl || null
}
