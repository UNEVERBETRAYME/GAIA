// 音频库自动加载模块
import { getAudioMetadata } from './audio-art.js'

// Mood 标签映射
const MOOD_TAGS = {
  'melancholy': '忧郁',
  'lonely': '孤独',
  'healing': '治愈',
  'calm': '平静'
}

// Mood 对应的默认歌单
const MOOD_DEFAULT_PLAYLISTS = {
  'lonely': '孤独之海',
  'melancholy': '深夜独白',
  'healing': '温柔治愈',
  'calm': '平静片刻'
}

// Mood 对应的渐变色
const MOOD_GRADIENTS = {
  'melancholy': 'linear-gradient(135deg, #1a2535, #0d1520)',
  'lonely': 'linear-gradient(135deg, #2a2a3d, #1a1a2e)',
  'healing': 'linear-gradient(135deg, #1a3025, #0d1a15)',
  'calm': 'linear-gradient(135deg, #2d1f3d, #1a1225)',
  'unknown': 'linear-gradient(135deg, #1e2a3a, #0f1923)'
}

const FALLBACK_PLAYLIST = '未分类'

// 可用的心情类型（用于随机分配）
const AVAILABLE_MOODS = ['melancholy', 'lonely', 'healing', 'calm']

/**
 * 为文件名生成稳定的随机 mood
 * 使用简单哈希确保同一文件名总是得到相同的 mood
 * @param {string} filename - 文件名
 * @returns {string} mood 类型
 */
function getRandomMoodForFile(filename) {
  // 简单哈希函数
  let hash = 0
  for (let i = 0; i < filename.length; i++) {
    const char = filename.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // 转换为 32 位整数
  }

  // 使用哈希值选择 mood
  const index = Math.abs(hash) % AVAILABLE_MOODS.length
  return AVAILABLE_MOODS[index]
}

/**
 * 从文件名中解析标签信息
 * @param {string} filename - 文件名（含扩展名）
 * @returns {Object} { mood, moodLabel, playlistName, displayName }
 */
export function parseFileTags(filename) {
  // 移除扩展名
  const nameWithoutExt = filename.replace(/\.(mp3|wav|ogg|flac|m4a)$/i, '')

  // 提取所有 [xxx] 标签（大小写不敏感）
  const tagRegex = /\[([^\]]+)\]/gi
  const tags = []
  let match
  while ((match = tagRegex.exec(nameWithoutExt)) !== null) {
    tags.push(match[1].trim())
  }

  // 解析 mood（取第一个匹配的）
  let mood = null
  let moodLabel = null
  for (const tag of tags) {
    const lowerTag = tag.toLowerCase()
    if (MOOD_TAGS[lowerTag]) {
      mood = lowerTag
      moodLabel = MOOD_TAGS[lowerTag]
      break
    }
  }

  // 如果没有 mood，随机分配一个（基于文件名哈希，保证稳定）
  if (!mood) {
    mood = getRandomMoodForFile(filename)
    moodLabel = MOOD_TAGS[mood]
  }

  // 解析 playlist（优先 pl:xxx 格式）
  let playlistName = null
  for (const tag of tags) {
    if (tag.toLowerCase().startsWith('pl:')) {
      playlistName = tag.substring(3).trim()
      break
    }
  }

  // 如果没有 pl 标签，按 mood 自动归类
  if (!playlistName) {
    playlistName = MOOD_DEFAULT_PLAYLISTS[mood]
  }

  // 生成展示名称（移除所有标签）
  const displayName = nameWithoutExt.replace(/\[([^\]]+)\]/g, '').trim()

  return {
    mood,
    moodLabel,
    playlistName,
    displayName
  }
}

/**
 * 从展示名称中解析歌曲名和艺术家
 * @param {string} displayName - 移除标签后的文件名
 * @returns {Object} { name, artist }
 */
function parseNameAndArtist(displayName) {
  // 按 " - " 分割
  const parts = displayName.split(' - ').map(p => p.trim())

  if (parts.length >= 2) {
    return {
      artist: parts[0],
      name: parts.slice(1).join(' - ')
    }
  }

  // 没有分隔符，全部作为歌曲名
  return {
    artist: '未知艺术家',
    name: displayName
  }
}

/**
 * 加载音频清单
 * @returns {Promise<Array<string>>} 文件名数组
 */
export async function loadAudioManifest() {
  try {
    const response = await fetch('/audio/manifest.json')
    if (!response.ok) {
      throw new Error(`加载音频清单失败: ${response.status}`)
    }
    const data = await response.json()
    return data.files || []
  } catch (error) {
    console.error('加载音频清单失败:', error)
    return []
  }
}

/**
 * 从文件列表构建歌曲对象数组
 * @param {Array<string>} files - 文件名数组
 * @returns {Array<Object>} 歌曲对象数组
 */
export function buildLibrarySongs(files) {
  return files.map((fileName) => {
    const parsed = parseFileTags(fileName)
    const { name, artist } = parseNameAndArtist(parsed.displayName)
    const gradient = MOOD_GRADIENTS[parsed.mood] || MOOD_GRADIENTS.unknown

    return {
      src: `/audio/${fileName}`,
      fileName,
      mood: parsed.mood,
      moodLabel: parsed.moodLabel,
      playlistName: parsed.playlistName,
      name,
      artist,
      gradient,
      coverUrl: null
    }
  })
}

/**
 * 按歌单分组歌曲
 * @param {Array<Object>} songs - 歌曲数组
 * @returns {Object} { playlistName: [songs...] }
 */
export function groupByPlaylist(songs) {
  const groups = {}

  songs.forEach(song => {
    const pl = song.playlistName || FALLBACK_PLAYLIST
    if (!groups[pl]) {
      groups[pl] = []
    }
    groups[pl].push(song)
  })

  return groups
}

/**
 * 懒加载：为歌曲对象加载 ID3 元数据
 * @param {Object} song - 歌曲对象
 * @returns {Promise<Object>} 更新后的歌曲对象
 */
export async function loadSongMetadata(song) {
  if (!song || !song.src) return song

  try {
    const metadata = await getAudioMetadata(song.src)

    if (metadata) {
      // 覆盖规则：ID3 优先
      if (metadata.title) {
        song.name = metadata.title
      }
      if (metadata.artist) {
        song.artist = metadata.artist
      }
      if (metadata.coverUrl) {
        song.coverUrl = metadata.coverUrl
      }
    }
  } catch (error) {
    console.warn(`加载 ID3 失败: ${song.src}`, error)
  }

  return song
}

/**
 * 批量懒加载：为歌曲数组加载 ID3（可选，用于预加载）
 * @param {Array<Object>} songs - 歌曲数组
 * @param {number} limit - 并发限制（默认 3）
 * @returns {Promise<Array<Object>>} 更新后的歌曲数组
 */
export async function loadSongsMetadata(songs, limit = 3) {
  const results = []

  for (let i = 0; i < songs.length; i += limit) {
    const batch = songs.slice(i, i + limit)
    const loaded = await Promise.all(
      batch.map(song => loadSongMetadata(song))
    )
    results.push(...loaded)
  }

  return results
}

