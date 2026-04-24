import { EMOTIONS, normalizeEmotionKey, getEmotionLabel, getEmotionDesc } from './emotions.js'

const SCENES = {
  self: { label: '写给自己' },
  toSomeone: { label: '发给 Ta' },
  post: { label: '发动态' },
  work: { label: '工作表达' },
}

const TONES = {
  restrained: { label: '克制' },
  gentle: { label: '温柔' },
  direct: { label: '直白' },
  poetic: { label: '诗意' },
}

const MOOD_KEYWORDS = {
  melancholy: ['难过', '失落', '委屈', '压抑', '心酸', '遗憾', '想哭', '难受', '崩溃', '撑不住', '喘不过气', '无力', '空落落'],
  calm: ['平静', '放松', '慢一点', '安静', '没事', '呼吸', '好一点', '稳住', '淡淡的', '就这样', '舒服', '清醒'],
  healing: ['想被抱抱', '治愈', '被理解', '安慰', '陪陪我', '温柔', '修复', '放下', '拥抱', '被听见', '照顾', '复原'],
  lonely: ['孤独', '一个人', '没人懂', '没人', '被忽略', '被丢下', '没有回应', '不被需要', '空', '冷', '深夜', '睡不着'],
}

const EMPATHY_LINES = {
  melancholy: [
    '你不是矫情，是你真的累了。',
    '你在硬撑，但你不必一直靠硬撑活下去。',
    '有些难过没有名字，也同样真实。',
    '你不需要把自己解释得很完美，才能被理解。',
    '先允许自己难过一会儿，再慢慢往前走。',
  ],
  calm: [
    '先把呼吸放慢一点，世界会跟着安静下来。',
    '你正在把注意力收回来，这很重要。',
    '这不是冷淡，是你在给自己留出空间。',
    '不需要立刻做决定，你可以先稳住。',
    '你正在回到你自己。',
  ],
  healing: [
    '你不是要被修理，你只是需要被温柔对待。',
    '你在努力把自己照顾好，这比看起来更难。',
    '你值得被安慰，也值得被认真对待。',
    '你不是脆弱，你只是终于不想再装作没事。',
    '你会慢慢好起来，不用抢着证明。',
  ],
  lonely: [
    '你不是没有人，只是缺少一个能接住你的人。',
    '你把很多话收回去，不是坚强，是没有出口。',
    '孤独不是缺席，是一种被放在一边的感觉。',
    '你不是不合群，你只是太久没有被真正听见。',
    '你不需要一直独自完成所有事。',
  ],
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

function hashString(str) {
  let h = 0
  for (let i = 0; i < str.length; i += 1) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0
  }
  return h
}

function countHits(text, keywords) {
  let hits = 0
  for (const kw of keywords) {
    if (!kw) continue
    if (text.includes(kw)) hits += 1
  }
  return hits
}

function pickOne(list, seed) {
  if (!list || list.length === 0) return ''
  const idx = seed % list.length
  return list[idx]
}

function guessMood(text) {
  const t = text.trim()
  if (!t) return { key: 'calm', scores: {} }

  const scores = {}
  const plain = t.toLowerCase()

  for (const e of EMOTIONS) {
    const key = e.key
    const kws = MOOD_KEYWORDS[key] || []
    const hits = countHits(plain, kws.map((x) => x.toLowerCase()))
    scores[key] = hits
  }

  if (/[！!]{2,}/.test(t)) scores.melancholy += 1
  if (/[。…]{2,}/.test(t)) scores.lonely += 1
  if (/[？?]{2,}/.test(t)) scores.melancholy += 1

  const entries = Object.entries(scores).sort((a, b) => b[1] - a[1])
  const best = entries[0]
  const key = best && best[1] > 0 ? best[0] : 'melancholy'
  return { key, scores }
}

function computeIntensity(text, scores, forced) {
  const t = text.trim()
  const base = 34 + Math.min(18, Math.floor(t.length / 22) * 3)
  const keywordBoost = Object.values(scores || {}).reduce((sum, v) => sum + v, 0) * 10
  const punctBoost = (t.match(/[！!]/g)?.length || 0) * 3 + (t.match(/[？?]/g)?.length || 0) * 2
  const raw = base + keywordBoost + punctBoost
  const fromText = clamp(raw, 22, 92)
  if (typeof forced === 'number') return clamp(forced, 0, 100)
  return fromText
}

function getIntensityTier(intensity) {
  if (intensity < 40) return 'low'
  if (intensity < 70) return 'mid'
  return 'high'
}

function fillTemplate(str, ctx) {
  return String(str || '')
    .replaceAll('{mood}', ctx.mood)
    .replaceAll('{desc}', ctx.desc)
}

function hasSelfHarmRisk(text) {
  const t = String(text || '').trim()
  if (!t) return false
  const keywords = [
    '自杀', '轻生', '想死', '不想活', '结束生命', '活不下去',
    '自残', '割腕', '跳楼', '了断', '不想存在', '结束一切',
    '离开这个世界', '死了算了', '死掉', '自行了断', '不想撑了',
    '没人需要', '想消失', '不想继续', '不想再这样',
  ]
  return keywords.some((k) => t.includes(k))
}

const TEMPLATE_BANK = {
  melancholy: {
    self: {
      restrained: {
        low: {
          oneLine: ['我有点{mood}，想先把节奏放慢一点。', '我现在有点累，心里也有点{mood}。'],
          short: ['我先缓一缓。', '我想先停一下，整理一下自己。'],
          long: ['我现在的情绪有点沉，但我不是要谁立刻解决。我只是想先把它说出来，让自己不再一直硬扛。', '我有点{mood}，像被一件小事按住了呼吸。我想先照顾好自己，再继续往前走。'],
          dialogue: ['我：我有点不太对劲。\n我：不是谁做错了什么，是我需要先缓过来。'],
        },
        mid: {
          oneLine: ['心里像压着一块东西，我想先喘口气。', '我有点{mood}，但我想把它说清楚。'],
          short: ['我有点难受，想先停一下。', '我需要一点安静。'],
          long: ['我现在的{mood}不是爆炸，是持续的下沉。我想把它放到桌面上看一看，而不是继续假装没事。', '我不太想再用“没事”敷衍自己了。我现在确实{mood}，我想先被允许这样一会儿。'],
          dialogue: ['我：我有点扛不住了。\n你：怎么了？\n我：我也在找更准确的说法，但我希望你先别急着给建议，先听我说完。'],
        },
        high: {
          oneLine: ['我现在有点撑不住了。', '我真的有点{mood}到说不出话。'],
          short: ['我需要先停下来。', '我现在不太能继续了。'],
          long: ['我现在很{mood}，不是因为我想闹情绪，是我真的有点撑不住了。我需要先停下来，让自己不再被这股情绪推着走。', '我现在的状态不太稳定，我怕我继续硬撑只会更糟。我想先安静一下，把自己找回来。'],
          dialogue: ['我：我现在真的有点撑不住。\n你：要我做什么？\n我：你先在就好，先别急着解决。'],
        },
      },
      gentle: {
        low: {
          oneLine: ['我有点{mood}，想被温柔地对待一下。', '我现在有点{mood}，想有人陪我把它说清楚。'],
          short: ['我想被抱一会儿。', '我有点难过。'],
          long: ['我有点{mood}。我不是要你替我承担，只是我希望你能把这件事当真：我现在确实不太好。', '我现在有点{mood}，我想把话说得更软一点，但也更真实一点。'],
          dialogue: ['我：我有点难过。\n你：我在。\n我：谢谢你先在，不急着让我变好。'],
        },
        mid: {
          oneLine: ['我有点{mood}，但我想好好说。', '我现在有点{mood}，想被认真听一会儿。'],
          short: ['我可以慢慢说吗？', '我想被听见。'],
          long: ['我现在有点{mood}。我不想把它变成争执，我只是希望我说的话能被你放在心上。', '我有点{mood}，我可能表达得不够好，但我希望你能先理解我的感受，再讨论对错。'],
          dialogue: ['我：我有点{mood}。\n你：你说。\n我：我可能说得乱，但我想你先别反驳，先听我讲完。'],
        },
        high: {
          oneLine: ['我现在真的很{mood}，我需要被接住。', '我有点{mood}到快要碎掉了。'],
          short: ['我真的很难受。', '我需要你在。'],
          long: ['我现在很{mood}，我不想再装作没事。我需要一点陪伴，哪怕只是你在这里听我说。', '我现在的{mood}很重，我需要先被安稳住，才有力气继续处理事情。'],
          dialogue: ['我：我现在有点崩了。\n你：我在。\n我：你先别让我坚强，先让我靠一会儿。'],
        },
      },
      direct: {
        low: {
          oneLine: ['我现在有点{mood}，我先缓一下。', '我需要一点时间整理状态。'],
          short: ['我先停一下。', '我需要缓一缓。'],
          long: ['我现在情绪不太好，我想先停一下，整理清楚再继续。', '我现在有点{mood}，我先把状态稳住，稍后再聊。'],
          dialogue: ['我：我先停一下。\n你：怎么了？\n我：我需要整理状态。'],
        },
        mid: {
          oneLine: ['我现在有点{mood}，我需要先把自己稳住。', '我不适合继续下去，我想先暂停。'],
          short: ['先暂停一下。', '我现在不适合继续。'],
          long: ['我现在有点{mood}，继续谈下去只会把话说得更难听。我想先暂停，等我整理好再继续。', '我现在的情绪会影响表达，我想先停一下，避免我们走偏。'],
          dialogue: ['我：先暂停。\n对方：为什么？\n我：我现在情绪不稳，再继续会伤人。'],
        },
        high: {
          oneLine: ['我现在很{mood}，我需要立刻停下来。', '我现在状态不行，先停。'],
          short: ['先停。', '我现在不行。'],
          long: ['我现在很{mood}，我需要立刻停下来，不然我会说出我不想说的话。', '我现在情绪过载，我先退出一下，等我恢复再继续。'],
          dialogue: ['我：先停。\n对方：你怎么了？\n我：我现在过载，继续只会更糟。'],
        },
      },
      poetic: {
        low: {
          oneLine: ['我把{mood}放在掌心里，先不急着解释。', '像一阵慢下来的风，{mood}把我轻轻按住。'],
          short: ['我想把自己放慢一点。', '我需要一点光。'],
          long: ['{mood}不是暴雨，它更像潮湿的夜，贴在心口。我想先把自己照顾好，再谈别的。', '我把今天的{mood}写下来，不是为了夸张，是为了让它有一个出口。'],
          dialogue: ['我：我像被夜色按住了。\n你：我在。\n我：那就够了。'],
        },
        mid: {
          oneLine: ['今晚的{mood}不吵不闹，只是贴在心口。', '我想把{mood}写得更准确一点。'],
          short: ['我有点沉。', '我想安静一会儿。'],
          long: ['{mood}像低频的海，听不见浪，却一直在。我想先把它说出来，让自己别再假装轻松。', '我不需要答案，我只想被理解：我现在的{mood}很真实。'],
          dialogue: ['我：我有点{mood}。\n你：要我说什么？\n我：你先别说，先在。'],
        },
        high: {
          oneLine: ['我像被一块无声的石头压住了。', '我现在的{mood}很重，重到我不想再装。'],
          short: ['我快撑不住了。', '我想先躲一下。'],
          long: ['我现在的{mood}像潮水涌上来，我需要先找个安全的地方呼吸。请让我先安静一下。', '我不想再把自己藏起来了。我现在真的很{mood}，我需要被接住。'],
          dialogue: ['我：我快撑不住了。\n你：我在。\n我：别催我变好。'],
        },
      },
    },
    toSomeone: {
      restrained: {
        low: {
          oneLine: ['我有点{mood}，我想把话说清楚，不想吵。', '我现在有点{mood}，我们能慢点说吗？'],
          short: ['我们慢一点说。', '我有点难受。'],
          long: ['我有点{mood}，但我不想把它变成争执。我想把我的感受讲清楚，也想听听你的真实想法。', '我现在有点{mood}，我希望我们能更认真地对待这件事，而不是一带而过。'],
          dialogue: ['我：我有点{mood}。\n你：我怎么了？\n我：我不想吵，我只想你认真听我说完。'],
        },
        mid: {
          oneLine: ['我现在有点{mood}，我希望你能认真听我说完。', '我有点{mood}，我不想再用玩笑带过去。'],
          short: ['请先听我说完。', '我想认真聊一下。'],
          long: ['我现在有点{mood}。我不是要你立刻道歉或解释，我只是希望你能把我的感受当成一件真实的事。', '我有点{mood}，我需要你先理解我在意的点，然后我们再谈解决。'],
          dialogue: ['我：我想认真说一件事。\n你：你说。\n我：我现在有点{mood}，我希望你先听完再回应。'],
        },
        high: {
          oneLine: ['我现在很{mood}，我需要你认真对待我。', '我现在很{mood}，我不想再被敷衍。'],
          short: ['别敷衍我。', '我真的很难受。'],
          long: ['我现在很{mood}，我需要你把这件事当成重要的事来回应我。不是为了争输赢，而是为了让我不再一个人消化。', '我现在的{mood}很重，我需要你给我一个清晰的回应，而不是模糊过去。'],
          dialogue: ['我：我真的很{mood}。\n你：对不起。\n我：我需要的不只是对不起，我需要你明白发生了什么。'],
        },
      },
      gentle: {
        low: {
          oneLine: ['我有点{mood}，不是怪你，我只是需要被理解。', '我有点{mood}，我想我们都温柔一点。'],
          short: ['我可以被理解一下吗？', '我有点难过。'],
          long: ['我有点{mood}，我不是来指责你的。我只是想说：我在意的不是对错，而是我是否被放在心上。', '我现在有点{mood}，我希望我们能先抱抱情绪，再讨论事情。'],
          dialogue: ['我：我有点{mood}。\n你：我听着。\n我：谢谢你先听。'],
        },
        mid: {
          oneLine: ['我有点{mood}，我需要你先听我说完。', '我现在有点{mood}，我想被认真对待。'],
          short: ['我想被认真听一会儿。', '你能先听我说吗？'],
          long: ['我现在有点{mood}。我不要求你完美，我只希望你愿意把我的感受当回事。', '我有点{mood}，我想我们先把彼此的感受放在桌面上，再谈怎么做。'],
          dialogue: ['我：我想说清楚一件事。\n你：好。\n我：我现在有点{mood}，你先别急着解释。'],
        },
        high: {
          oneLine: ['我现在很{mood}，我需要你抱紧一点。', '我现在很{mood}，我不想一个人扛。'],
          short: ['我需要你。', '我不想自己扛了。'],
          long: ['我现在很{mood}，我知道我可能说得重，但我真的需要你接住我一会儿。', '我现在的{mood}很大，我不想把它憋成冷暴力或沉默。我想把它说出来，也想被你抱一抱。'],
          dialogue: ['我：我现在有点崩。\n你：我在。\n我：那你先别走。'],
        },
      },
      direct: {
        low: {
          oneLine: ['我现在有点{mood}，我们把话说清楚。', '我有点{mood}，我需要你认真回应。'],
          short: ['我们认真聊一下。', '请认真回应我。'],
          long: ['我现在有点{mood}，我不想再绕圈子。我需要你明确回应我在意的点。', '我有点{mood}，我希望我们把话说清楚，别用沉默糊弄过去。'],
          dialogue: ['我：我需要你明确说。\n你：说什么？\n我：你到底在不在意我刚才说的。'],
        },
        mid: {
          oneLine: ['我现在有点{mood}，我不想再被轻描淡写带过去。', '我需要你给我一个清晰的回应。'],
          short: ['别糊弄过去。', '请直接回应。'],
          long: ['我现在有点{mood}，我需要你给我一个清晰的态度。不是为了赢，是为了让我安心。', '我不想再猜了。我需要你说清楚，我们要怎么继续。'],
          dialogue: ['我：我不想再猜。\n你：那你想怎样？\n我：给我一个清晰的回应。'],
        },
        high: {
          oneLine: ['我现在很{mood}，先别继续了。', '我现在状态不好，我们先停。'],
          short: ['先停。', '我现在不行。'],
          long: ['我现在很{mood}，继续聊只会伤人。我们先停下来，等我冷静一点再继续。', '我现在情绪很重，我需要先离开一下，不然我们会把关系越聊越糟。'],
          dialogue: ['我：我们先停。\n你：你要走？\n我：我需要冷静，不是逃避。'],
        },
      },
      poetic: {
        low: {
          oneLine: ['我有点{mood}，像话到嘴边又咽回去。', '我想把{mood}说得温柔一点。'],
          short: ['我有点沉。', '我想慢慢说。'],
          long: ['我现在有点{mood}，不是为了让你内疚。我只是想让你知道：我在意你，也在意我自己。', '我把{mood}放进一句话里，希望它能被你听见，而不是被风带走。'],
          dialogue: ['我：我有点{mood}。\n你：我在听。\n我：那就够了。'],
        },
        mid: {
          oneLine: ['我现在的{mood}像一盏灯，亮着却不热。', '我想把{mood}写清楚，再交给你。'],
          short: ['我想被理解。', '别急着解释。'],
          long: ['我现在有点{mood}，像被轻轻推开。你不需要立刻做什么，我只是希望你先靠近一点。', '我不想把{mood}变成尖锐的句子，我想让它保持真实，也保持尊重。'],
          dialogue: ['我：我有点{mood}。\n你：对不起。\n我：别急着对不起，先明白我在说什么。'],
        },
        high: {
          oneLine: ['我现在的{mood}像潮水，我需要先退到岸上。', '我现在很{mood}，请先让我安静一下。'],
          short: ['我想先退开一点。', '我需要呼吸。'],
          long: ['我现在很{mood}，我怕我继续说下去会变得尖锐。我想先退开一点，等我能更温柔地说出来。', '我现在的{mood}很重，我想先把它放下，再回来继续谈。'],
          dialogue: ['我：我先退一下。\n你：你还会回来吗？\n我：会，但不是现在。'],
        },
      },
    },
    post: {
      restrained: {
        low: {
          oneLine: ['今天有点{mood}，我先把自己放慢一点。', '我把今天的{mood}写下来，算是给自己一个出口。'],
          short: ['今天有点沉。', '先这样。'],
          long: ['今天的{mood}不吵不闹，但一直在。我想先承认它，然后把自己照顾好。', '有些情绪不需要立刻变成故事。今天我只想诚实：我有点{mood}。'],
          dialogue: ['我：今天有点{mood}。\n我：没关系，先写下来。'],
        },
        mid: {
          oneLine: ['{mood}不是崩溃，是一整天的慢慢下沉。', '我不想装作没事，所以写一句：我有点{mood}。'],
          short: ['我有点{mood}。', '今天不太好。'],
          long: ['我把今天的{mood}放在这里，不求被理解，只求不再假装。', '有些{mood}不是因为某件事，而是因为太久没有被照顾。今天我想先照顾自己。'],
          dialogue: ['我：我今天有点{mood}。\n我：我知道。\n我：那就够了。'],
        },
        high: {
          oneLine: ['我今天有点撑不住。', '今天的{mood}很重，我先把它放在这里。'],
          short: ['今天很难。', '我需要喘口气。'],
          long: ['今天的{mood}很重，我不想再强装。我先把它写下来，让它别继续压在心里。', '如果你也刚好很难，希望你知道：你不孤单。'],
          dialogue: ['我：今天很难。\n我：先活过今晚。'],
        },
      },
      gentle: {
        low: {
          oneLine: ['今天有点{mood}，希望我能对自己温柔一点。', '我有点{mood}，想给自己留一点柔软。'],
          short: ['对自己温柔一点。', '先抱抱自己。'],
          long: ['今天的{mood}让我想起：我也需要被照顾。希望我能先把自己抱紧一点。', '我有点{mood}，但我也在努力把它说得温柔。'],
          dialogue: ['我：我有点{mood}。\n我：没事，先抱抱自己。'],
        },
        mid: {
          oneLine: ['我有点{mood}，但我还在。', '今天有点{mood}，我想慢慢走。'],
          short: ['我还在。', '慢慢来。'],
          long: ['今天的{mood}让我想慢一点。不是躲开生活，是给自己一点空间。', '我有点{mood}，但我也知道：我会慢慢好起来。'],
          dialogue: ['我：我今天有点{mood}。\n我：谢谢你还在。'],
        },
        high: {
          oneLine: ['今天的{mood}很重，但我想被温柔接住。', '我今天有点崩，但我会慢慢修复。'],
          short: ['我需要被接住。', '我有点崩。'],
          long: ['今天的{mood}很重。我不求谁立刻懂我，我只希望自己能先对自己好一点。', '我今天有点崩，但我知道崩溃不是失败，它只是需要休息。'],
          dialogue: ['我：我有点崩。\n我：没关系，慢慢来。'],
        },
      },
      direct: {
        low: {
          oneLine: ['今天状态一般，我先照顾自己。', '今天有点{mood}，先不营业。'],
          short: ['先这样。', '今天不太行。'],
          long: ['今天有点{mood}，我先照顾自己，明天再说。', '今天状态不太好，我先停一下。'],
          dialogue: ['我：今天不太行。\n我：我先休息。'],
        },
        mid: {
          oneLine: ['今天有点{mood}，我需要安静。', '我现在有点{mood}，先别打扰我。'],
          short: ['我需要安静。', '我先下线。'],
          long: ['今天有点{mood}，我需要安静一点，把自己找回来。', '我现在情绪不太稳，先不回应所有事情。'],
          dialogue: ['我：我先下线。\n我：等我好了再说。'],
        },
        high: {
          oneLine: ['今天很难，我需要先停下来。', '我现在过载，先休息。'],
          short: ['我过载了。', '先停。'],
          long: ['今天很难，我需要先停下来，不然我会被情绪拖着走。', '我现在过载，我先退出一下。'],
          dialogue: ['我：我过载了。\n我：先停。'],
        },
      },
      poetic: {
        low: {
          oneLine: ['我把{mood}写成一句话，放在夜里。', '今天的{mood}像潮湿的路灯。'],
          short: ['夜很长。', '我有点沉。'],
          long: ['{mood}像一层薄雾，不重，但遮住了远处。我把它写下来，算是给自己留一个出口。', '今天的{mood}不喧哗，它只是安静地在。'],
          dialogue: ['我：今天有点{mood}。\n我：写下来就好。'],
        },
        mid: {
          oneLine: ['{mood}像低频的海，我听见了。', '我把{mood}放在这儿，不求回应。'],
          short: ['我听见自己了。', '先这样。'],
          long: ['{mood}像潮水涌上来，我先不抵抗。我把它写下来，让它有一个名字。', '我把{mood}放在这里，像把一盏灯留给自己。'],
          dialogue: ['我：我有点{mood}。\n我：我知道。'],
        },
        high: {
          oneLine: ['今晚的{mood}很重，我先靠岸。', '我想先从海里走出来。'],
          short: ['我想靠岸。', '我需要呼吸。'],
          long: ['今晚的{mood}很重，我先靠岸。等我能呼吸了，再继续走。', '我不想再把自己沉下去。我想先把自己抱住。'],
          dialogue: ['我：我先靠岸。\n我：等我能呼吸了再回来。'],
        },
      },
    },
    work: {
      restrained: {
        low: {
          oneLine: ['我需要一点时间整理信息，我们稍后继续。', '我先把要点理顺，再同步。'],
          short: ['我先整理一下。', '稍后我补充。'],
          long: ['我现在的信息有点散，为了保证讨论有效，我想先把重点整理清楚，再继续推进。', '我先把上下文和要点补齐，避免我们在误解里继续推进。'],
          dialogue: ['我：我想先整理一下再继续。\n对方：好的。\n我：我整理完会马上同步。'],
        },
        mid: {
          oneLine: ['我现在状态不适合继续推进，我想先整理再继续。', '我需要先把信息对齐，避免误解扩大。'],
          short: ['我先暂停整理一下。', '我需要先对齐信息。'],
          long: ['我现在情绪和信息有点混在一起。为了保证沟通质量，我想先停一下，把关键信息对齐，再继续。', '我需要先把边界和目标说清楚，再进入讨论。'],
          dialogue: ['我：我们先暂停一下。\n对方：原因？\n我：我需要先对齐信息，避免误解。'],
        },
        high: {
          oneLine: ['我现在不适合继续讨论，我需要先冷静下来。', '我现在过载，先停一下。'],
          short: ['先停一下。', '我需要冷静。'],
          long: ['我现在不适合继续讨论，继续下去只会让沟通质量下降。我需要先冷静和整理，再继续推进。', '我现在过载，先停一下，避免我们说出彼此都不想要的话。'],
          dialogue: ['我：先停一下。\n对方：好。\n我：我整理完会继续。'],
        },
      },
      gentle: {
        low: {
          oneLine: ['我想先把信息理顺，再继续沟通。', '我需要一点时间整理一下，再给你更清晰的反馈。'],
          short: ['我整理一下再回。', '我先理清楚。'],
          long: ['我想先把信息理顺，再继续沟通。这样我们都能更省力。', '我需要一点时间整理一下，再给你更清晰的反馈，避免误会。'],
          dialogue: ['我：我整理一下再回。\n对方：好。\n我：谢谢。'],
        },
        mid: {
          oneLine: ['我现在有点被信息压住了，我想先理清再继续。', '我需要先稳住节奏，再继续推进。'],
          short: ['我先稳住节奏。', '我需要整理一下。'],
          long: ['我现在有点被信息压住了。我想先理清思路，再继续推进，这样不会浪费彼此时间。', '我需要先稳住节奏，把边界和目标说清楚，再继续讨论。'],
          dialogue: ['我：我需要一点时间整理。\n对方：OK。\n我：整理完我会继续跟进。'],
        },
        high: {
          oneLine: ['我现在不太适合继续讨论，我需要先稳定状态。', '我先离开一下，整理完再回来。'],
          short: ['我先稳定一下。', '我先离开整理。'],
          long: ['我现在不太适合继续讨论，我需要先稳定状态。等我整理完，我们再继续推进。', '我先离开一下，把信息和状态整理好，再回来继续沟通。'],
          dialogue: ['我：我先离开一下整理。\n对方：好。\n我：谢谢理解。'],
        },
      },
      direct: {
        low: {
          oneLine: ['我先整理信息，稍后继续。', '我需要补齐要点，再继续。'],
          short: ['稍后继续。', '我先整理。'],
          long: ['我先整理信息，稍后继续推进。', '我需要补齐要点和结论，再继续讨论。'],
          dialogue: ['我：我先整理。\n对方：多久？\n我：我整理完会直接同步。'],
        },
        mid: {
          oneLine: ['我现在不适合继续讨论，先暂停。', '先对齐信息，再继续。'],
          short: ['先暂停。', '先对齐信息。'],
          long: ['我现在不适合继续讨论，先暂停。我整理完再继续。', '先对齐信息和目标，再进入讨论，不然我们会越说越散。'],
          dialogue: ['我：先暂停。\n对方：原因？\n我：信息不齐，继续只会浪费时间。'],
        },
        high: {
          oneLine: ['先停。我现在过载。', '我现在状态不行，先暂停。'],
          short: ['先停。', '我过载了。'],
          long: ['我现在过载，继续讨论会变得低效。先暂停，我整理完再继续。', '我现在状态不行，先暂停，避免沟通质量下降。'],
          dialogue: ['我：先停。\n对方：好。\n我：我整理完再继续。'],
        },
      },
      poetic: {
        low: {
          oneLine: ['我想先把线头理顺，再继续推进。', '我先把信息收拢，再继续说。'],
          short: ['我先理线头。', '我先收拢信息。'],
          long: ['我想先把线头理顺，再继续推进。这样我们会更快到达结论。', '我先把信息收拢，再继续说，避免我们在雾里打转。'],
          dialogue: ['我：我先把线头理顺。\n对方：好。\n我：理顺后我再同步。'],
        },
        mid: {
          oneLine: ['我需要先把信息从雾里拉出来。', '我先把结论和证据对齐，再继续。'],
          short: ['我先把雾散开。', '我先对齐结论。'],
          long: ['我需要先把信息从雾里拉出来，再继续讨论，不然我们会越聊越乱。', '我先把结论和证据对齐，再继续，这样不会伤到彼此的耐心。'],
          dialogue: ['我：我先理清楚。\n对方：好的。\n我：理清后我再继续。'],
        },
        high: {
          oneLine: ['我先退一步把自己稳住，再回来。', '我先离开一下，等我能清晰表达再继续。'],
          short: ['我先退一步。', '我先离开一下。'],
          long: ['我先退一步把自己稳住，再回来继续推进。', '我先离开一下，等我能清晰表达再继续，这样对我们都好。'],
          dialogue: ['我：我先退一步。\n对方：好。\n我：我会回来继续。'],
        },
      },
    },
  },
  calm: {
    self: {
      restrained: {
        low: {
          oneLine: ['我想先安静一会儿，把自己放回当下。', '我现在更想慢一点。'],
          short: ['我想慢一点。', '我先安静一下。'],
          long: ['我想先安静一会儿，把注意力收回来。等我更清楚了，再继续做决定。', '我现在需要的是稳定和清晰。我先把节奏放慢，再继续。'],
          dialogue: ['我：我想先慢一点。\n我：先把自己放回当下。'],
        },
        mid: {
          oneLine: ['我想把自己稳住，再继续。', '我现在更需要清晰，不需要催促。'],
          short: ['我想先稳住。', '我先把思路理清。'],
          long: ['我想把自己稳住，再继续。不是逃避，是为了更清晰地面对接下来的事。', '我现在更需要清晰。我先把思路理一遍，再继续。'],
          dialogue: ['我：我先稳住。\n我：等我清晰一点再继续。'],
        },
        high: {
          oneLine: ['我需要先停下来呼吸。', '我需要先把自己稳住。'],
          short: ['我需要呼吸。', '我先停一下。'],
          long: ['我需要先停下来呼吸，把自己稳住。等我恢复清晰，我们再继续。', '我现在有点被节奏推着走，我想先停一下，把自己放回掌控里。'],
          dialogue: ['我：我先停一下。\n我：我需要呼吸。'],
        },
      },
      gentle: {
        low: {
          oneLine: ['我想温柔地慢下来。', '我想给自己留一点空间。'],
          short: ['我想慢慢来。', '我先照顾自己。'],
          long: ['我想温柔地慢下来，给自己留一点空间。等我准备好了，再继续。', '我现在需要的是一点安稳。我先把自己照顾好。'],
          dialogue: ['我：我想慢慢来。\n你：好。\n我：谢谢。'],
        },
        mid: {
          oneLine: ['我想把自己放稳一点。', '我需要一点安稳的时间。'],
          short: ['我想稳一点。', '我需要一点安稳。'],
          long: ['我想把自己放稳一点。不是因为我不在意，而是我想用更好的状态继续。', '我需要一点安稳的时间，把心里的噪音降下去。'],
          dialogue: ['我：我想先稳住。\n你：好。\n我：我会回来继续。'],
        },
        high: {
          oneLine: ['我需要先被安稳住。', '我现在需要的是安静和空间。'],
          short: ['我需要安静。', '我需要空间。'],
          long: ['我需要先被安稳住，让自己不再被焦虑推着走。等我稳定下来，我们再继续。', '我现在需要安静和空间。我不是走开，我是在保护我们。'],
          dialogue: ['我：我需要安静一下。\n你：好。\n我：谢谢你理解。'],
        },
      },
      direct: {
        low: {
          oneLine: ['我先停一下，整理一下。', '我需要一点时间。'],
          short: ['我需要时间。', '我先停一下。'],
          long: ['我先停一下，整理一下思路，稍后继续。', '我需要一点时间，等我想清楚再说。'],
          dialogue: ['我：我需要一点时间。\n你：好。'],
        },
        mid: {
          oneLine: ['我需要先把节奏放慢，别催我。', '我先整理清楚再继续。'],
          short: ['别催我。', '我先整理。'],
          long: ['我需要先把节奏放慢，别催我。我整理清楚再继续。', '我先整理清楚再继续，避免我们说着说着走偏。'],
          dialogue: ['我：先别催。\n你：好。\n我：我整理完再说。'],
        },
        high: {
          oneLine: ['我现在需要停下来。', '先停，我需要冷静。'],
          short: ['先停。', '我需要冷静。'],
          long: ['我现在需要停下来，等我冷静和清晰一点再继续。', '先停。我需要冷静，否则我会做出不理智的反应。'],
          dialogue: ['我：先停。\n你：好。'],
        },
      },
      poetic: {
        low: {
          oneLine: ['我想让心慢一点，像灯光一样柔。', '我想把自己放回当下。'],
          short: ['慢一点。', '安静一点。'],
          long: ['我想让心慢一点，像灯光一样柔。等我更清晰了，再继续。', '我想把自己放回当下，让呼吸先替我说话。'],
          dialogue: ['我：慢一点。\n我：把自己放回当下。'],
        },
        mid: {
          oneLine: ['我想把噪音关小一点。', '我想把自己放稳。'],
          short: ['把噪音关小。', '我想稳一点。'],
          long: ['我想把噪音关小一点，先听见自己。等我更稳了，再继续。', '我想把自己放稳，不急着做决定。'],
          dialogue: ['我：我想先稳住。\n你：好。\n我：谢谢。'],
        },
        high: {
          oneLine: ['我想先让世界安静下来。', '我需要先靠近安静。'],
          short: ['我需要安静。', '我先靠岸。'],
          long: ['我想先让世界安静下来，给自己一点空间呼吸。', '我需要先靠近安静，等我能呼吸了再继续。'],
          dialogue: ['我：我先靠岸。\n你：好。\n我：我会回来。'],
        },
      },
    },
  },
  healing: {
    self: {
      restrained: {
        low: {
          oneLine: ['我想把自己照顾好一点。', '我想慢慢修复自己。'],
          short: ['我先照顾自己。', '我想缓一缓。'],
          long: ['我想把自己照顾好一点，不再用“没事”把自己推过去。', '我想慢慢修复自己，先从好好睡一觉、好好吃一顿开始。'],
          dialogue: ['我：我想对自己好一点。\n我：从现在开始。'],
        },
        mid: {
          oneLine: ['我想把自己找回来一点。', '我想慢慢好起来。'],
          short: ['我想好起来。', '我想被安稳住。'],
          long: ['我想把自己找回来一点。不是立刻变好，而是慢慢变轻。', '我想慢慢好起来。我愿意给自己时间。'],
          dialogue: ['我：我想好起来。\n我：慢慢来就好。'],
        },
        high: {
          oneLine: ['我需要先被安稳住。', '我现在需要修复。'],
          short: ['我需要安稳。', '我需要休息。'],
          long: ['我现在需要先被安稳住，再谈别的。我想先让自己活得轻一点。', '我现在需要修复，不是因为我坏了，而是因为我太久没有好好被照顾。'],
          dialogue: ['我：我需要被安稳住。\n我：先别催我。'],
        },
      },
      gentle: {
        low: {
          oneLine: ['我想给自己一点温柔。', '我想被好好抱一会儿。'],
          short: ['抱抱自己。', '我想被温柔对待。'],
          long: ['我想给自己一点温柔，哪怕只是今天不再苛责自己。', '我想被好好抱一会儿，让心先软下来。'],
          dialogue: ['我：我想被温柔对待。\n你：你值得。'],
        },
        mid: {
          oneLine: ['我想慢慢把自己照亮。', '我想让自己舒服一点。'],
          short: ['我想舒服一点。', '我想被照顾。'],
          long: ['我想慢慢把自己照亮，不用证明给任何人看。', '我想让自己舒服一点，先把刺收起来。'],
          dialogue: ['我：我想舒服一点。\n你：可以。\n我：谢谢。'],
        },
        high: {
          oneLine: ['我现在需要被接住。', '我想先躲进一段温柔里。'],
          short: ['我需要被接住。', '我想靠一会儿。'],
          long: ['我现在需要被接住。哪怕只是有人在，也会让我好很多。', '我想先躲进一段温柔里，等我能呼吸了再出来。'],
          dialogue: ['我：我需要被接住。\n你：我在。\n我：别走。'],
        },
      },
      direct: {
        low: {
          oneLine: ['我需要休息和恢复。', '我先照顾自己。'],
          short: ['我需要休息。', '我先恢复。'],
          long: ['我需要休息和恢复，之后再继续处理。', '我先照顾自己，等我状态好一些再说。'],
          dialogue: ['我：我需要休息。\n你：好。'],
        },
        mid: {
          oneLine: ['我现在需要恢复，不适合继续。', '我需要先把自己修复好。'],
          short: ['我需要恢复。', '我先修复。'],
          long: ['我现在需要恢复，不适合继续强撑。', '我需要先把自己修复好，再继续面对。'],
          dialogue: ['我：我先修复一下。\n你：好。\n我：我恢复后再继续。'],
        },
        high: {
          oneLine: ['我现在撑不住了，我需要立刻休息。', '我需要先停下来恢复。'],
          short: ['我撑不住了。', '我需要立刻休息。'],
          long: ['我现在撑不住了，我需要立刻休息和恢复。', '我需要先停下来恢复，否则我会更糟。'],
          dialogue: ['我：我撑不住了。\n你：好。\n我：我先休息。'],
        },
      },
      poetic: {
        low: {
          oneLine: ['我想把自己抱紧一点，像抱住一盏灯。', '我想让心柔软一点。'],
          short: ['抱紧一点。', '柔软一点。'],
          long: ['我想把自己抱紧一点，像抱住一盏灯。哪怕光很小，也够我走一段路。', '我想让心柔软一点，把刺放回鞘里。'],
          dialogue: ['我：我想抱住自己。\n我：像抱住一盏灯。'],
        },
        mid: {
          oneLine: ['我想把自己慢慢照亮。', '我想让伤口先透气。'],
          short: ['慢慢照亮。', '让伤口透气。'],
          long: ['我想把自己慢慢照亮，不用急着证明我没事。', '我想让伤口先透气，再慢慢结痂。'],
          dialogue: ['我：我想慢慢好起来。\n你：我在。\n我：谢谢。'],
        },
        high: {
          oneLine: ['我想先躲进一段温柔里。', '我想先被光抱住。'],
          short: ['我想躲一下。', '我想被抱住。'],
          long: ['我想先躲进一段温柔里，等我能呼吸了再回来。', '我想先被光抱住，不用强撑。'],
          dialogue: ['我：我想先躲一下。\n你：好。\n我：谢谢你允许。'],
        },
      },
    },
  },
  lonely: {
    self: {
      restrained: {
        low: {
          oneLine: ['我有点{mood}，但我还在。', '我只是有点想被听见。'],
          short: ['我想被听见。', '我有点孤单。'],
          long: ['我有点{mood}，不是因为我不合群，是因为我好像很久没有被真正听见。', '我只是有点{mood}，我想有人能问一句：你还好吗。'],
          dialogue: ['我：我有点{mood}。\n我：我知道。\n我：那就够了。'],
        },
        mid: {
          oneLine: ['我有点{mood}，像被放在一边。', '我有点{mood}，我想有人能接住我一会儿。'],
          short: ['我有点{mood}。', '我想有人在。'],
          long: ['我有点{mood}，像被放在一边很久了。我不怪谁，但我也不想继续习惯。', '我有点{mood}，我想有人能接住我一会儿，不用说很多。'],
          dialogue: ['我：我有点{mood}。\n你：我在。\n我：那就够了。'],
        },
        high: {
          oneLine: ['我现在很{mood}，我需要被接住。', '我现在很{mood}，我不想一个人扛。'],
          short: ['我不想一个人扛。', '我需要你在。'],
          long: ['我现在很{mood}，我不想一个人扛。我需要被接住一会儿，哪怕只是有人在。', '我现在的{mood}很重，我需要一个出口。'],
          dialogue: ['我：我不想一个人扛。\n你：我在。\n我：谢谢。'],
        },
      },
      gentle: {
        low: {
          oneLine: ['我有点{mood}，想被抱一会儿。', '我有点{mood}，想有人轻轻靠近我。'],
          short: ['抱抱我。', '陪我一会儿。'],
          long: ['我有点{mood}，想被抱一会儿。我不需要你解决什么，我只需要你在。', '我有点{mood}，想有人轻轻靠近我，不用用力。'],
          dialogue: ['我：我有点{mood}。\n你：我在。\n我：谢谢你在。'],
        },
        mid: {
          oneLine: ['我有点{mood}，我想被认真放在心上。', '我有点{mood}，想有人陪我走一段。'],
          short: ['我想被放在心上。', '你能陪我一下吗？'],
          long: ['我有点{mood}，我想被认真放在心上。不是占有，是需要。', '我有点{mood}，想有人陪我走一段，不用说很多。'],
          dialogue: ['我：你能陪我一下吗？\n你：可以。\n我：谢谢。'],
        },
        high: {
          oneLine: ['我现在很{mood}，我需要你抱紧一点。', '我现在很{mood}，我想被接住。'],
          short: ['我需要你。', '我想被接住。'],
          long: ['我现在很{mood}，我需要你抱紧一点。不是因为我弱，是因为我太久没被照顾。', '我现在很{mood}，我想被接住一会儿。'],
          dialogue: ['我：我现在很{mood}。\n你：我在。\n我：别走。'],
        },
      },
      direct: {
        low: {
          oneLine: ['我有点{mood}，我需要有人在。', '我需要一点陪伴。'],
          short: ['陪我一下。', '我需要你在。'],
          long: ['我有点{mood}，我需要有人在。你不需要解决，只需要在。', '我需要一点陪伴。'],
          dialogue: ['我：我需要你在。\n你：好。'],
        },
        mid: {
          oneLine: ['我现在有点{mood}，别让我一个人扛。', '我需要你给我回应。'],
          short: ['别让我一个人扛。', '给我回应。'],
          long: ['我现在有点{mood}，别让我一个人扛。给我一点回应就好。', '我需要你给我回应，不用多，但要真实。'],
          dialogue: ['我：你能回我一下吗？\n你：好。\n我：谢谢。'],
        },
        high: {
          oneLine: ['我现在很{mood}，我需要立刻被接住。', '我现在撑不住了，别让我一个人。'],
          short: ['别让我一个人。', '我撑不住了。'],
          long: ['我现在很{mood}，我需要立刻被接住。', '我现在撑不住了，别让我一个人。'],
          dialogue: ['我：别让我一个人。\n你：好。\n我：谢谢。'],
        },
      },
      poetic: {
        low: {
          oneLine: ['我有点{mood}，像灯亮着却没人回家。', '我想有人把我从夜里轻轻领出来。'],
          short: ['灯亮着。', '夜很长。'],
          long: ['我有点{mood}，像灯亮着却没人回家。我想有人能走近一点。', '我想有人把我从夜里轻轻领出来，不用急。'],
          dialogue: ['我：夜很长。\n你：我在。\n我：那就好。'],
        },
        mid: {
          oneLine: ['{mood}像一间空房子，回声很大。', '我有点{mood}，像话落在地上没人接。'],
          short: ['回声很大。', '我想被接住。'],
          long: ['{mood}像一间空房子，回声很大。我想有人能把门推开一点。', '我有点{mood}，像话落在地上没人接。我想有人把它捡起来。'],
          dialogue: ['我：我有点{mood}。\n你：我在听。\n我：谢谢。'],
        },
        high: {
          oneLine: ['我像被夜色按住了。', '我现在很{mood}，我想先靠岸。'],
          short: ['我想靠岸。', '我想被抱住。'],
          long: ['我像被夜色按住了。我想先靠岸，等我能呼吸了再继续走。', '我现在很{mood}，我想先被抱住。'],
          dialogue: ['我：我想靠岸。\n你：好。\n我：谢谢你在。'],
        },
      },
    },
  },
}

function pickFromBank(bank, moodKey, scene, tone, tier, field, seed) {
  const m = bank[moodKey] || {}
  const s = m[scene] || {}
  const t = s[tone] || {}
  const list = t?.[tier]?.[field] || t?.mid?.[field] || t?.low?.[field] || t?.high?.[field] || []
  return pickOne(list, seed) || ''
}

function buildFromTemplates(moodKey, tone, scene, intensity, seed) {
  const tier = getIntensityTier(intensity)
  const ctx = { mood: getEmotionLabel(moodKey), desc: getEmotionDesc(moodKey) }
  const oneLine = fillTemplate(pickFromBank(TEMPLATE_BANK, moodKey, scene, tone, tier, 'oneLine', seed + 11), ctx)
  const short = fillTemplate(pickFromBank(TEMPLATE_BANK, moodKey, scene, tone, tier, 'short', seed + 23), ctx)
  const long = fillTemplate(pickFromBank(TEMPLATE_BANK, moodKey, scene, tone, tier, 'long', seed + 37), ctx)
  const dialogue = fillTemplate(pickFromBank(TEMPLATE_BANK, moodKey, scene, tone, tier, 'dialogue', seed + 53), ctx)
  return { oneLine, rewrites: { short, long, dialogue } }
}

function buildPrompts(moodKey) {
  const label = getEmotionLabel(moodKey)
  const desc = getEmotionDesc(moodKey)
  const image = `情绪：${label}\n画面：低饱和、柔光、克制的对比\n氛围：安静、细微的孤独感\n提示：${desc}`
  const music = `情绪：${label}\n风格：慢速、氛围、留白\n元素：柔和和弦、少量钢琴/Pad、低频不侵略\n关键词：late-night, ambient, minimal, warm, intimate`
  const words = `请写一段 120-180 字的文字，表达“${label}”的情绪。\n要求：克制、有温度、不矫情；像在深夜对自己说话；结尾留一个轻的出口。`
  return { image, music, words }
}

export function translateEmotion(rawText, options = {}) {
  const text = String(rawText || '').trim()

  if (hasSelfHarmRisk(text)) {
    return { safety: true, input: text }
  }

  const scene = options.scene in SCENES ? options.scene : 'self'
  const tone = options.tone in TONES ? options.tone : 'restrained'
  const forcedIntensity = typeof options.intensity === 'number' ? options.intensity : null

  const { key, scores } = guessMood(text)
  const moodPrimary = normalizeEmotionKey(options.moodPrimary) || key

  const ranked = Object.entries(scores || {}).sort((a, b) => b[1] - a[1]).map(([k]) => k)
  const moodSecondary = ranked.filter((k) => k !== moodPrimary && scores[k] > 0).slice(0, 2)

  const intensity = computeIntensity(text, scores, forcedIntensity)
  const seed = hashString(text + moodPrimary + tone + scene)
  const empathy = pickOne(EMPATHY_LINES[moodPrimary] || [], seed)

  const built = buildFromTemplates(moodPrimary, tone, scene, intensity, seed)
  const prompts = buildPrompts(moodPrimary)

  return {
    input: text,
    scene,
    tone,
    intensity,
    moodPrimary,
    moodSecondary,
    empathy,
    oneLine: built.oneLine,
    rewrites: built.rewrites,
    prompts,
  }
}

export async function translateEmotionAsync(rawText, options = {}) {
  const text = String(rawText || '').trim()

  if (hasSelfHarmRisk(text)) {
    return { safety: true, input: text }
  }

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 4500)

    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: controller.signal,
    })

    clearTimeout(timer)

    if (!res.ok) {
      return translateEmotion(rawText, options)
    }

    const data = await res.json()

    if (data.fallback || !data.result) {
      return translateEmotion(rawText, options)
    }

    return data.result
  } catch {
    return translateEmotion(rawText, options)
  }
}

export { SCENES, TONES, hasSelfHarmRisk }
