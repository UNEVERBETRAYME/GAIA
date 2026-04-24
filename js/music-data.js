export const playlistsData = [
  {
    name: '深夜独白',
    desc: '灯灭之后，剩下的句子都写给自己听',
    gradient: 'var(--gradient-song-primary)',
    songs: [
      { name: 'Tears for My Love', artist: '1CEKary', mood: 'melancholy', gradient: 'var(--gradient-song-primary)', src: '/audio/Tears4MaLuv.mp3' },
      { name: '和平分手', artist: '徐良 / Britneylee小暖', mood: 'melancholy', gradient: 'var(--gradient-song-twilight)', src: '/audio/徐良,Britneylee小暖 - 和平分手.mp3' },
      { name: '坏女孩', artist: '徐良 / 小凌', mood: 'lonely', gradient: 'var(--gradient-song-dusk)', src: '/audio/徐良,小凌 - 坏女孩.mp3' },
      { name: '后会无期', artist: '徐良 / 汪苏泷', mood: 'lonely', gradient: 'var(--gradient-song-night)', src: '/audio/徐良,汪苏泷 - 后会无期.mp3' },
      { name: '犯贱', artist: '徐良 / 阿悄', mood: 'melancholy', gradient: 'var(--gradient-song-primary)', src: '/audio/徐良,阿悄 - 犯贱.mp3' },
      { name: '够爱', artist: '曾沛慈', mood: 'melancholy', gradient: 'var(--gradient-song-dusk)', src: '/audio/曾沛慈 - 够爱.mp3' },
      { name: '落差', artist: 'JinJiBeWater_隼', mood: 'lonely', gradient: 'var(--gradient-song-twilight)', src: '/audio/JinJiBeWater_隼 - 落差.mp3' },
    ],
  },
  {
    name: '城市迷雾',
    desc: '霓虹散场后，城市仍在耳边缓慢发光',
    gradient: 'var(--gradient-song-night)',
    songs: [
      { name: '世界不等我', artist: 'SASIOVERLXRD', mood: 'lonely', gradient: 'var(--gradient-song-night)', src: '/audio/SASIOVERLXRD - 世界不等我.mp3' },
      { name: '半套', artist: 'SASIOVERLXRD', mood: 'melancholy', gradient: 'var(--gradient-song-primary)', src: '/audio/SASIOVERLXRD - 半套(Prod.2FAS).mp3' },
      { name: '脆弱', artist: 'SASIOVERLXRD', mood: 'lonely', gradient: 'var(--gradient-song-twilight)', src: '/audio/SASIOVERLXRD - 脆弱(Prod.Shot03）.mp3' },
      { name: '信', artist: 'mac ova seas', mood: 'calm', gradient: 'var(--gradient-song-night)', src: '/audio/mac ova seas - 信.mp3' },
      { name: '내일은 없어', artist: 'Trouble Maker', mood: 'melancholy', gradient: 'var(--gradient-song-primary)', src: '/audio/Trouble Maker - 내일은 없어.mp3' },
    ],
  },
  {
    name: '温柔治愈',
    desc: '把刺放下，让心在柔光里慢慢复原',
    gradient: 'var(--gradient-song-healing)',
    songs: [
      { name: 'OD妹', artist: '极品贵公子1CEKary艾斯凯瑞', mood: 'healing', gradient: 'var(--gradient-song-healing)', src: '/audio/极品贵公子1CEKary艾斯凯瑞 - OD妹.mp3' },
      { name: 'Heartbreaker', artist: 'Justin Bieber', mood: 'healing', gradient: 'var(--gradient-song-primary)', src: '/audio/Justin Bieber - Heartbreaker.mp3' },
    ],
  },
]

export const allSongs = []
playlistsData.forEach((pl) => {
  pl.songs.forEach((song) => {
    allSongs.push({ ...song, playlistName: pl.name })
  })
})

export function getMoodLabel(mood) {
  const map = { melancholy: '忧郁', calm: '平静', healing: '治愈', lonely: '孤独' }
  return map[mood] || ''
}

export function findSongByKey(key) {
  const [plIdx, songIdx] = key.split('-').map(Number)
  const pl = playlistsData[plIdx]
  if (!pl) return null
  const song = pl.songs[songIdx]
  if (!song) return null
  return { song, playlistName: pl.name }
}

export function findSongBySrc(src) {
  for (const song of allSongs) {
    if (song.src === src) return song
  }
  return null
}
