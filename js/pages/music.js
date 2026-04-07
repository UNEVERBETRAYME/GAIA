/**
 * music.js - 情绪音乐板块专属脚本
 * 负责：歌单展开/收起、点击歌曲更新播放器、心情标签筛选、真实音频播放
 */

// ============================================================
// 歌曲数据（src 对应 public/audio/ 中的真实文件）
// ============================================================

const playlistsData = [
  {
    name: '深夜独白',
    desc: '适合一个人静静聆听的旋律',
    gradient: 'linear-gradient(135deg, #1a2535, #0d1520)',
    songs: [
      { name: 'Tears for My Love', duration: '0:00', artist: '1CEKary', mood: 'melancholy', gradient: 'linear-gradient(135deg, #1a2535, #0d1520)', src: '/audio/Tears4MaLuv.mp3' },
      { name: '和平分手', duration: '0:00', artist: '徐良 / Britneylee小暖', mood: 'melancholy', gradient: 'linear-gradient(135deg, #1e2a3a, #0f1923)', src: '/audio/徐良,Britneylee小暖 - 和平分手.mp3' },
      { name: '坏女孩', duration: '0:00', artist: '徐良 / 小凌', mood: 'lonely', gradient: 'linear-gradient(135deg, #2a2a3d, #1a1a2e)', src: '/audio/徐良,小凌 - 坏女孩.mp3' },
    ],
  },
  {
    name: '城市迷雾',
    desc: '都市夜晚的电子氛围',
    gradient: 'linear-gradient(135deg, #2d1f3d, #1a1225)',
    songs: [
      { name: '后会无期', duration: '0:00', artist: '徐良 / 汪苏泷', mood: 'lonely', gradient: 'linear-gradient(135deg, #2d1f3d, #1a1225)', src: '/audio/徐良,汪苏泷 - 后会无期.mp3' },
      { name: '犯贱', duration: '0:00', artist: '徐良 / 阿悄', mood: 'melancholy', gradient: 'linear-gradient(135deg, #1a2535, #0d1520)', src: '/audio/徐良,阿悄 - 犯贱.mp3' },
    ],
  },
  {
    name: '温柔治愈',
    desc: '温暖的旋律，抚慰疲惫的心',
    gradient: 'linear-gradient(135deg, #1a3025, #0d1a15)',
    songs: [
      { name: 'OD妹', duration: '0:00', artist: '极品贵公子1CEKary艾斯凯瑞', mood: 'healing', gradient: 'linear-gradient(135deg, #1a3025, #0d1a15)', src: '/audio/极品贵公子1CEKary艾斯凯瑞 - OD妹.wav' },
    ],
  },
]

// 扁平化所有歌曲，用于心情推荐
const allSongs = []
playlistsData.forEach((pl) => {
  pl.songs.forEach((song) => {
    allSongs.push({ ...song, playlistName: pl.name })
  })
})

// ============================================================
// 音频实例与播放器状态
// ============================================================

const audio = document.getElementById('audioPlayer')
let currentSong = null
let isPlaying = false

function getMoodLabel(mood) {
  const map = { melancholy: '忧郁', calm: '平静', healing: '治愈', lonely: '孤独' }
  return map[mood] || ''
}

function updatePlayer(song, playlistName) {
  currentSong = song

  // 更新 UI
  document.getElementById('playerArt').style.background = song.gradient
  document.getElementById('playerTitle').textContent = song.name
  document.getElementById('playerArtist').textContent = playlistName || song.artist
  document.getElementById('playerMood').textContent = getMoodLabel(song.mood)
  document.getElementById('totalTime').textContent = song.duration
  document.getElementById('currentTime').textContent = '0:00'
  document.getElementById('progressFill').style.width = '0%'

  // 高亮当前歌曲
  document.querySelectorAll('.music-song').forEach((el) => el.classList.remove('active'))
  const songEl = document.querySelector(`.music-song[data-song="${song._key}"]`)
  if (songEl) songEl.classList.add('active')

  // 加载并播放音频
  if (!song.src) {
    isPlaying = false
    document.getElementById('playIcon').textContent = '▶'
    document.getElementById('playIcon').classList.remove('spinning')
    return
  }

  audio.src = song.src
  audio.load()

  audio.play().then(() => {
    isPlaying = true
    document.getElementById('playIcon').textContent = '⏸'
    document.getElementById('playIcon').classList.add('spinning')
  }).catch(() => {
    // 自动播放被浏览器阻止
    isPlaying = false
    document.getElementById('playIcon').textContent = '▶'
    document.getElementById('playIcon').classList.remove('spinning')
  })
}

// ============================================================
// 音频事件绑定
// ============================================================

function initAudioEvents() {
  // 元数据加载完成
  audio.addEventListener('loadedmetadata', () => {
    document.getElementById('totalTime').textContent = formatTime(Math.round(audio.duration))
  })

  // 播放进度更新
  audio.addEventListener('timeupdate', () => {
    if (!audio.duration) return
    const percent = (audio.currentTime / audio.duration) * 100
    document.getElementById('progressFill').style.width = `${percent}%`
    document.getElementById('currentTime').textContent = formatTime(Math.round(audio.currentTime))
  })

  // 播放结束
  audio.addEventListener('ended', () => {
    isPlaying = false
    document.getElementById('playIcon').textContent = '▶'
    document.getElementById('playIcon').classList.remove('spinning')
  })

  // 播放出错
  audio.addEventListener('error', () => {
    isPlaying = false
    document.getElementById('playIcon').textContent = '▶'
    document.getElementById('playIcon').classList.remove('spinning')
    document.getElementById('playerTitle').textContent = '播放失败'
  })
}

// ============================================================
// 歌单展开/收起
// ============================================================

function initPlaylists() {
  const cards = document.querySelectorAll('.music-playlist-card')

  cards.forEach((card) => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.music-song')) return

      const isExpanded = card.classList.contains('expanded')
      cards.forEach((c) => c.classList.remove('expanded'))

      if (!isExpanded) {
        card.classList.add('expanded')
      }
    })
  })

  // 点击歌曲 → 更新播放器
  const songs = document.querySelectorAll('.music-song')
  songs.forEach((songEl) => {
    const key = songEl.dataset.song
    const [plIdx, songIdx] = key.split('-').map(Number)
    const song = playlistsData[plIdx].songs[songIdx]
    song._key = key

    songEl.addEventListener('click', (e) => {
      e.stopPropagation()
      updatePlayer(song, playlistsData[plIdx].name)
    })
  })
}

// ============================================================
// 播放控制
// ============================================================

function initPlayerControls() {
  const playBtn = document.getElementById('playBtn')
  const playIcon = document.getElementById('playIcon')

  playBtn.addEventListener('click', () => {
    if (!currentSong) return

    if (isPlaying) {
      audio.pause()
      isPlaying = false
      playIcon.textContent = '▶'
      playIcon.classList.remove('spinning')
    } else {
      audio.play().then(() => {
        isPlaying = true
        playIcon.textContent = '⏸'
        playIcon.classList.add('spinning')
      }).catch(() => {})
    }
  })

  // 进度条点击 → 跳转
  const progressBar = document.querySelector('.music-player__progress-bar')
  progressBar.addEventListener('click', (e) => {
    if (!currentSong || !audio.duration) return

    const rect = progressBar.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    audio.currentTime = percent * audio.duration
  })
}

// ============================================================
// 时间工具
// ============================================================

function formatTime(seconds) {
  const min = Math.floor(seconds / 60)
  const sec = Math.round(seconds % 60)
  return `${min}:${sec.toString().padStart(2, '0')}`
}

// ============================================================
// 心情推荐
// ============================================================

function initMoodTags() {
  const tags = document.querySelectorAll('.music-mood-tag')
  const grid = document.getElementById('moodsGrid')

  function renderMoodCards(mood) {
    const filtered = mood === 'all' ? allSongs : allSongs.filter((s) => s.mood === mood)
    grid.innerHTML = ''

    filtered.forEach((song) => {
      const card = document.createElement('div')
      card.className = 'glass-card music-mood-card'
      card.innerHTML = `
        <div class="music-mood-card__art" style="background: ${song.gradient}"></div>
        <div class="music-mood-card__info">
          <div class="music-mood-card__name">${song.name}</div>
          <div class="music-mood-card__artist">${song.playlistName}</div>
        </div>
        <span class="glass-tag music-mood-card__mood-tag">${getMoodLabel(song.mood)}</span>
      `

      card.addEventListener('click', () => {
        updatePlayer(song, song.playlistName)
      })

      grid.appendChild(card)
    })
  }

  tags.forEach((tag) => {
    tag.addEventListener('click', () => {
      tags.forEach((t) => t.classList.remove('active'))
      tag.classList.add('active')
      renderMoodCards(tag.dataset.mood)
    })
  })

  renderMoodCards('all')
}

// ============================================================
// 初始化
// ============================================================

function initMusicPage() {
  initAudioEvents()
  initPlaylists()
  initPlayerControls()
  initMoodTags()
}

document.addEventListener('DOMContentLoaded', initMusicPage)
