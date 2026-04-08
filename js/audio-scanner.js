// 音频文件自动识别与标签解析

// Mood 标签映射（优先级从高到低）
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

const FALLBACK_PLAYLIST = '未分类'

/**
 * 从文件名中解析标签信息
 * @param {string} filename - 文件名（含扩展名）
 * @returns {Object} { mood, moodLabel, playlist, displayName }
 */
export function parseFileTags(filename) {
  // 移除扩展名
  const nameWithoutExt = filename.replace(/\.(mp3|wav|ogg|flac|m4a)$/i, '')

  // 提取所有 [xxx] 标签
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

  // 解析 playlist（优先 pl:xxx 格式）
  let playlist = null
  for (const tag of tags) {
    if (tag.toLowerCase().startsWith('pl:')) {
      playlist = tag.substring(3).trim()
      break
    }
  }

  // 如果没有 pl 标签，按 mood 自动归类
  if (!playlist && mood) {
    playlist = MOOD_DEFAULT_PLAYLISTS[mood]
  }

  // 如果都没有，归入未分类
  if (!playlist) {
    playlist = FALLBACK_PLAYLIST
  }

  // 生成展示名称（移除所有标签）
  const displayName = nameWithoutExt.replace(/\[([^\]]+)\]/g, '').trim()

  return {
    mood,
    moodLabel,
    playlist,
    displayName
  }
}

/**
 * 从文件列表生成音乐数据结构
 * @param {Array<string>} files - 文件名数组
 * @returns {Array<Object>} 音乐数据数组
 */
export function generateMusicData(files) {
  return files.map((filename, index) => {
    const parsed = parseFileTags(filename)

    return {
      id: index + 1,
      title: parsed.displayName,
      artist: '未知艺术家', // 可后续从文件名解析
      src: `/audio/${filename}`,
      mood: parsed.mood,
      moodLabel: parsed.moodLabel,
      playlist: parsed.playlist
    }
  })
}

/**
 * 按歌单分组音乐数据
 * @param {Array<Object>} musicData - 音乐数据数组
 * @returns {Object} { playlistName: [songs...] }
 */
export function groupByPlaylist(musicData) {
  const groups = {}

  musicData.forEach(song => {
    const pl = song.playlist || FALLBACK_PLAYLIST
    if (!groups[pl]) {
      groups[pl] = []
    }
    groups[pl].push(song)
  })

  return groups
}

/**
 * 按 mood 分组音乐数据
 * @param {Array<Object>} musicData - 音乐数据数组
 * @returns {Object} { mood: [songs...] }
 */
export function groupByMood(musicData) {
  const groups = {}

  musicData.forEach(song => {
    const mood = song.mood || 'unknown'
    if (!groups[mood]) {
      groups[mood] = []
    }
    groups[mood].push(song)
  })

  return groups
}
