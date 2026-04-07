const playlistsData = [
  {
    name: '深夜独白',
    desc: '适合一个人静静聆听的旋律',
    gradient: 'linear-gradient(135deg, #1a2535, #0d1520)',
    songs: [
      { name: 'Tears for My Love', artist: '1CEKary', mood: 'melancholy', gradient: 'linear-gradient(135deg, #1a2535, #0d1520)', src: '/audio/Tears4MaLuv.mp3' },
      { name: '和平分手', artist: '徐良 / Britneylee小暖', mood: 'melancholy', gradient: 'linear-gradient(135deg, #1e2a3a, #0f1923)', src: '/audio/徐良,Britneylee小暖 - 和平分手.mp3' },
      { name: '坏女孩', artist: '徐良 / 小凌', mood: 'lonely', gradient: 'linear-gradient(135deg, #2a2a3d, #1a1a2e)', src: '/audio/徐良,小凌 - 坏女孩.mp3' },
      { name: '后会无期', artist: '徐良 / 汪苏泷', mood: 'lonely', gradient: 'linear-gradient(135deg, #2d1f3d, #1a1225)', src: '/audio/徐良,汪苏泷 - 后会无期.mp3' },
      { name: '犯贱', artist: '徐良 / 阿悄', mood: 'melancholy', gradient: 'linear-gradient(135deg, #1a2535, #0d1520)', src: '/audio/徐良,阿悄 - 犯贱.mp3' },
      { name: '够爱', artist: '曾沛慈', mood: 'melancholy', gradient: 'linear-gradient(135deg, #2a2a3d, #1a1a2e)', src: '/audio/曾沛慈 - 够爱.mp3' },
      { name: '落差', artist: 'JinJiBeWater_隼', mood: 'lonely', gradient: 'linear-gradient(135deg, #1e2a3a, #0f1923)', src: '/audio/JinJiBeWater_隼 - 落差.mp3' },
    ],
  },
  {
    name: '城市迷雾',
    desc: '都市夜晚的电子氛围',
    gradient: 'linear-gradient(135deg, #2d1f3d, #1a1225)',
    songs: [
      { name: '世界不等我', artist: 'SASIOVERLXRD', mood: 'lonely', gradient: 'linear-gradient(135deg, #2d1f3d, #1a1225)', src: '/audio/SASIOVERLXRD - 世界不等我.mp3' },
      { name: '半套', artist: 'SASIOVERLXRD', mood: 'melancholy', gradient: 'linear-gradient(135deg, #1a2535, #0d1520)', src: '/audio/SASIOVERLXRD - 半套(Prod.2FAS).mp3' },
      { name: '脆弱', artist: 'SASIOVERLXRD', mood: 'lonely', gradient: 'linear-gradient(135deg, #1e2a3a, #0f1923)', src: '/audio/SASIOVERLXRD - 脆弱(Prod.Shot03）.mp3' },
      { name: '信', artist: 'mac ova seas', mood: 'calm', gradient: 'linear-gradient(135deg, #2d1f3d, #1a1225)', src: '/audio/mac ova seas - 信.mp3' },
      { name: '내일은 없어', artist: 'Trouble Maker', mood: 'melancholy', gradient: 'linear-gradient(135deg, #1a2535, #0d1520)', src: '/audio/Trouble Maker - 내일은 없어.mp3' },
    ],
  },
  {
    name: '温柔治愈',
    desc: '温暖的旋律，抚慰疲惫的心',
    gradient: 'linear-gradient(135deg, #1a3025, #0d1a15)',
    songs: [
      { name: 'OD妹', artist: '极品贵公子1CEKary艾斯凯瑞', mood: 'healing', gradient: 'linear-gradient(135deg, #1a3025, #0d1a15)', src: '/audio/极品贵公子1CEKary艾斯凯瑞 - OD妹.wav' },
      { name: 'Heartbreaker', artist: 'Justin Bieber', mood: 'healing', gradient: 'linear-gradient(135deg, #1a2535, #0d1520)', src: '/audio/Justin Bieber - Heartbreaker.mp3' },
    ],
  },
]

const allSongs = []
playlistsData.forEach((pl) => {
  pl.songs.forEach((song) => {
    allSongs.push({ ...song, playlistName: pl.name })
  })
})

const audio = document.getElementById('audioPlayer')
let currentSong = null
let isPlaying = false

function getMoodLabel(mood) {
  const map = { melancholy: '忧郁', calm: '平静', healing: '治愈', lonely: '孤独' }
  return map[mood] || ''
}

function updatePlayer(song, playlistName) {
  currentSong = song

  document.getElementById('playerArt').style.background = song.gradient
  document.getElementById('playerTitle').textContent = song.name
  document.getElementById('playerArtist').textContent = playlistName || song.artist
  document.getElementById('playerMood').textContent = getMoodLabel(song.mood)
  document.getElementById('currentTime').textContent = '0:00'
  document.getElementById('progressFill').style.width = '0%'
  document.getElementById('totalTime').textContent = '--:--'

  document.querySelectorAll('.music-song').forEach((el) => el.classList.remove('active'))
  const songEl = document.querySelector(`.music-song[data-key="${song._key}"]`)
  if (songEl) songEl.classList.add('active')

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
    isPlaying = false
    document.getElementById('playIcon').textContent = '▶'
    document.getElementById('playIcon').classList.remove('spinning')
  })
}

function initAudioEvents() {
  audio.addEventListener('loadedmetadata', () => {
    document.getElementById('totalTime').textContent = formatTime(Math.round(audio.duration))
  })

  audio.addEventListener('timeupdate', () => {
    if (!audio.duration) return
    const percent = (audio.currentTime / audio.duration) * 100
    document.getElementById('progressFill').style.width = `${percent}%`
    document.getElementById('currentTime').textContent = formatTime(Math.round(audio.currentTime))
  })

  audio.addEventListener('ended', () => {
    isPlaying = false
    document.getElementById('playIcon').textContent = '▶'
    document.getElementById('playIcon').classList.remove('spinning')
  })

  audio.addEventListener('error', () => {
    isPlaying = false
    document.getElementById('playIcon').textContent = '▶'
    document.getElementById('playIcon').classList.remove('spinning')
    document.getElementById('playerTitle').textContent = '播放失败'
  })
}

function renderPlaylists() {
  const grid = document.getElementById('playlistsGrid')
  if (!grid) return
  grid.innerHTML = ''

  playlistsData.forEach((pl, plIdx) => {
    const card = document.createElement('div')
    card.className = 'glass-card music-playlist-card'
    card.dataset.playlist = plIdx

    const songsHtml = pl.songs.map((song, songIdx) => {
      const key = `${plIdx}-${songIdx}`
      song._key = key
      return `<div class="music-song" data-key="${key}"><span class="music-song__name">${song.name}</span><span class="music-song__duration">--:--</span></div>`
    }).join('')

    card.innerHTML = `
      <div class="music-playlist-card__cover" style="background: ${pl.gradient}"></div>
      <div class="music-playlist-card__info">
        <h3 class="music-playlist-card__name">${pl.name}</h3>
        <span class="glass-tag music-playlist-card__count">${pl.songs.length} 首</span>
      </div>
      <p class="music-playlist-card__desc">${pl.desc}</p>
      <div class="music-playlist-card__songs">${songsHtml}</div>
    `

    grid.appendChild(card)
  })

  grid.addEventListener('click', (e) => {
    const songEl = e.target.closest('.music-song')
    if (songEl) {
      e.stopPropagation()
      const key = songEl.dataset.key
      const [plIdx, songIdx] = key.split('-').map(Number)
      const song = playlistsData[plIdx].songs[songIdx]
      updatePlayer(song, playlistsData[plIdx].name)
      return
    }

    const card = e.target.closest('.music-playlist-card')
    if (card) {
      const isExpanded = card.classList.contains('expanded')
      grid.querySelectorAll('.music-playlist-card').forEach((c) => c.classList.remove('expanded'))
      if (!isExpanded) card.classList.add('expanded')
    }
  })
}

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

  const progressBar = document.querySelector('.music-player__progress-bar')
  progressBar.addEventListener('click', (e) => {
    if (!currentSong || !audio.duration) return
    const rect = progressBar.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    audio.currentTime = percent * audio.duration
  })
}

function formatTime(seconds) {
  const min = Math.floor(seconds / 60)
  const sec = Math.round(seconds % 60)
  return `${min}:${sec.toString().padStart(2, '0')}`
}

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

function initMusicPage() {
  initAudioEvents()
  renderPlaylists()
  initPlayerControls()
  initMoodTags()
}

document.addEventListener('DOMContentLoaded', initMusicPage)
