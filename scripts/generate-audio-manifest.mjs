import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 支持的音频格式
const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.m4a', '.flac']

// 音频目录路径
const AUDIO_DIR = path.resolve(__dirname, '../public/audio')
const OUTPUT_FILE = path.join(AUDIO_DIR, 'manifest.json')

/**
 * 扫描音频目录并生成 manifest
 */
function generateManifest() {
  try {
    // 检查目录是否存在
    if (!fs.existsSync(AUDIO_DIR)) {
      console.error(`Audio directory not found: ${AUDIO_DIR}`)
      process.exit(1)
    }

    // 读取目录内容
    const files = fs.readdirSync(AUDIO_DIR)

    // 过滤音频文件并排序
    const audioFiles = files
      .filter(file => {
        const ext = path.extname(file).toLowerCase()
        return AUDIO_EXTENSIONS.includes(ext)
      })
      .sort((a, b) => a.localeCompare(b, 'zh-CN'))

    // 生成 manifest 对象
    const manifest = {
      generatedAt: new Date().toISOString(),
      files: audioFiles
    }

    // 写入文件
    fs.writeFileSync(
      OUTPUT_FILE,
      JSON.stringify(manifest, null, 2),
      'utf-8'
    )

    console.log(`Audio manifest generated: ${OUTPUT_FILE}`)
    console.log(`Files scanned: ${audioFiles.length}`)
  } catch (error) {
    console.error('Failed to generate audio manifest:', error.message)
    process.exit(1)
  }
}

generateManifest()
