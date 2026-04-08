// 测试标签解析逻辑
import { parseFileTags } from './js/audio-library.js'

// 测试用例
const testFiles = [
  '[lonely] Test Artist - Lonely Song.mp3',
  '[healing][pl:Custom Playlist] Healer - Calm Mind.mp3',
  '[melancholy] Sad Singer - 忧伤的歌.mp3',
  '[calm] Peaceful - Meditation.mp3',
  'No Tags - Regular Song.mp3',
  '徐良,阿悄 - 犯贱.mp3'
]

console.log('=== 文件名标签推断测试 ===\n')

testFiles.forEach(filename => {
  const result = parseFileTags(filename)
  console.log(`文件名: ${filename}`)
  console.log(`  心情标签: ${result.mood} ${result.moodLabel ? `(${result.moodLabel})` : ''}`)
  console.log(`  归属歌单: ${result.playlistName}`)
  console.log(`  显示名称: ${result.displayName}`)
  console.log(`  标签已移除: ${!result.displayName.includes('[')}\n`)
})
