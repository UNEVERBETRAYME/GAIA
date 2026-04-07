/**
 * music.js - 情绪音乐板块专属脚本
 * 负责：歌单展开/收起、点击歌曲更新播放器、心情标签筛选、播放控制
 */

// ============================================================
// 占位数据
// ============================================================

const playlistsData = [
  {
    name: '深夜独白',
    desc: '适合一个人静静聆听的旋律',
    gradient: 'linear-gradient(135deg, #1a2535, #0d1520)',
    songs: [
      { name: '凌晨三点的街', duration: '3:42', artist: '未知', mood: 'lonely', gradient: 'linear-gradient(135deg, #1a2535, #0d1520)' },
      { name: '雨落窗台', duration: '4:15', artist: '未知', mood: 'melancholy', gradient: 'linear-gradient(135deg, #1e2a3a, #0f1923)' },
      { name: '空荡的房间', duration: '3:58', artist: '未知', mood: 'lonely', gradient: 'linear-gradient(135deg, #2a2a3d, #1a1a2e)' },
      { name: '月光下的影子', duration: '4:30', artist: '未知', mood: 'calm', gradient: 'linear-gradient(135deg, #1a2535, #0d1520)' },
      { name: '晚安，陌生人', duration: '3:21', artist: '未知', mood: 'melancholy', gradient: 'linear-gradient(135deg, #2d1f3d, #1a1225)' },
    ],
  },
  {
    name: '城市迷雾',
    desc: '都市夜晚的电子氛围',
    gradient: 'linear-gradient(135deg, #2d1f3d, #1a1225)',
    songs: [
      { name: '霓虹倒影', duration: '4:08', artist: '未知', mood: 'calm', gradient: 'linear-gradient(135deg, #2d1f3d, #1a1225)' },
      { name: '地铁末班车', duration: '3:45', artist: '未知', mood: 'lonely', gradient: 'linear-gradient(135deg, #1a2535, #0d1520)' },
      { name: '天台上的风', duration: '5:12', artist: '未知', mood: 'calm', gradient: 'linear-gradient(135deg, #1e2a3a, #0f1923)' },
      { name: '午夜便利店', duration: '3:33', artist: '未知', mood: 'lonely', gradient: 'linear-gradient(135deg, #2d1f3d, #1a1225)' },
    ],
  },
  {
    name: '温柔治愈',
    desc: '温暖的旋律，抚慰疲惫的心',
    gradient: 'linear-gradient(135deg, #1a3025, #0d1a15)',
    songs: [
      { name: '晨光微暖', duration: '3:55', artist: '未知', mood: 'healing', gradient: 'linear-gradient(135deg, #1a3025, #0d1a15)' },
      { name: '海边的信', duration: '4:22', artist: '未知', mood: 'healing', gradient: 'linear-gradient(135deg, #1a2535, #0d1520)' },
      { name: '老树下的秋千', duration: '3:48', artist: '未知', mood: 'calm', gradient: 'linear-gradient(135deg, #1e2a3a, #0f1923)' },
      { name: '归途', duration: '4:05', artist: '未知', mood: 'healing', gradient: 'linear-gradient(135deg, #1a3025, #0d1a15)' },
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
// 播放器状态
// ============================================================

let currentSong = null
let isPlaying = false

function updatePlayer(song, playlistName) {
  currentSong = song

  document.getElementById('playerArt').style.background = song.gradient
  document.getElementById('playerTitle').textContent = song.name
  document.getElementById('playerArtist').textContent = playlistName || song.artist
  document.getElementById('playerMood').textContent = getMoodLabel(song.mood)
  document.getElementById('totalTime').textContent = song.duration
  document.getElementById('currentTime').textContent = '0:00'
  document.getElementById('progressFill').style.width = '0%'

  // 更新播放按钮
  isPlaying = true
  document.getElementById('playIcon').textContent = '⏸'

  // 高亮当前歌曲
  document.querySelectorAll('.music-song').forEach((el) => el.classList.remove('active'))
  const songEl = document.querySelector(`.music-song[data-song="${song._key}"]`)
  if (songEl) songEl.classList.add('active')
}

function getMoodLabel(mood) {
  const map = { melancholy: '忧郁', calm: '平静', healing: '治愈', lonely: '孤独' }
  return map[mood] || ''
}

// ============================================================
// 歌单展开/收起
// ============================================================

function initPlaylists() {
  const cards = document.querySelectorAll('.music-playlist-card')

  cards.forEach((card) => {
    card.addEventListener('click', (e) => {
      // 如果点击的是歌曲，不触发展开/收起
      if (e.target.closest('.music-song')) return

      const isExpanded = card.classList.contains('expanded')

      // 收起所有
      cards.forEach((c) => c.classList.remove('expanded'))

      // 展开当前（如果之前未展开）
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

    isPlaying = !isPlaying
    playIcon.textContent = isPlaying ? '⏸' : '▶'
    playIcon.classList.toggle('spinning', isPlaying)
  })

  // 进度条点击模拟
  const progressBar = document.querySelector('.music-player__progress-bar')
  progressBar.addEventListener('click', (e) => {
    if (!currentSong) return

    const rect = progressBar.getBoundingClientRect()
    const percent = ((e.clientX - rect.left) / rect.width) * 100
    document.getElementById('progressFill').style.width = `${percent}%`

    // 模拟时间更新
    const totalSeconds = parseDuration(currentSong.duration)
    const currentSeconds = Math.round((percent / 100) * totalSeconds)
    document.getElementById('currentTime').textContent = formatTime(currentSeconds)
  })
}

function parseDuration(str) {
  const [min, sec] = str.split(':').map(Number)
  return min * 60 + sec
}

function formatTime(seconds) {
  const min = Math.floor(seconds / 60)
  const sec = seconds % 60
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

  // 初始渲染
  renderMoodCards('all')
}

// ============================================================
// 初始化
// ============================================================

function initMusicPage() {
  initPlaylists()
  initPlayerControls()
  initMoodTags()
}

document.addEventListener('DOMContentLoaded', initMusicPage)
