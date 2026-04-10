// 测试随机分配逻辑
import { parseFileTags } from '../../js/audio-library.js'

const testFiles = [
  '徐良,阿悄 - 犯贱.mp3',
  '陈绮贞 - 太聪明.mp3',
  '黄浩 - 恋人 伴奏.mp3',
  'HAON,GISELLE - Skrr.mp3',
  'Justin Bieber - Heartbreaker.mp3',
  'Tears4MaLuv.mp3',
  '罗言 - 后视镜.mp3',
  '曾沛慈 - 够爱.mp3',
  'mac ova seas - 信.mp3',
  'Pimmie,PARTYNEXTDOOR,Drake - PIMMIE\'S DILEMMA.mp3'
]

console.log('=== 未分类音乐随机分配测试 ===\n')
console.log('规则：无标签的音乐会根据文件名哈希随机分配到 4 个心情歌单\n')

testFiles.forEach(filename => {
  const result = parseFileTags(filename)
  console.log(`文件名: ${filename}`)
  console.log(`  → 心情: ${result.mood} (${result.moodLabel})`)
  console.log(`  → 歌单: ${result.playlistName}`)
  console.log(`  → 显示: ${result.displayName}\n`)
})

console.log('=== 稳定性测试（同一文件多次解析） ===\n')
const testFile = '徐良,阿悄 - 犯贱.mp3'
const results = []
for (let i = 0; i < 5; i++) {
  const result = parseFileTags(testFile)
  results.push(result.mood)
}

const allSame = results.every(mood => mood === results[0])
console.log(`文件: ${testFile}`)
console.log(`5 次解析结果: ${results.join(', ')}`)
console.log(`结果一致: ${allSame ? '✅ 通过' : '❌ 失败'}`)
