import { EMOTIONS, normalizeEmotionKey, readEmotionFromUrl, replaceMoodInCurrentUrl, buildUrlWithMood } from '../emotions.js'

function typewriter(element, text, speed = 100) {
  return new Promise((resolve) => {
    element.textContent = ''
    element.classList.add('typing')
    let i = 0

    function type() {
      if (i < text.length) {
        element.textContent += text.charAt(i)
        i++
        setTimeout(type, speed)
      } else {
        setTimeout(() => {
          element.classList.remove('typing')
          resolve()
        }, 800)
      }
    }

    type()
  })
}

function initHeroTypewriter() {
  const heroTitle = document.getElementById('heroTitle')
  if (!heroTitle) return

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          typewriter(heroTitle, '伤感文字', 180)
          observer.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.5 }
  )

  observer.observe(heroTitle)
}

function initEssayExpand() {
  const essaysSection = document.querySelector('.words-essays')
  if (!essaysSection) return

  essaysSection.addEventListener('click', (e) => {
    const btn = e.target.closest('.words-essay-card__btn')
    if (!btn) return

    const index = btn.dataset.essay
    const card = btn.closest('.words-essay-card')
    const bodyEl = document.getElementById(`essayBody${index}`)

    if (!card || !bodyEl) return

    const isExpanded = card.classList.contains('expanded')

    if (isExpanded) {
      card.classList.remove('expanded')
      bodyEl.classList.remove('expanded')
      btn.textContent = '阅读全文'
    } else {
      card.classList.add('expanded')
      bodyEl.classList.add('expanded')
      btn.textContent = '收起'
    }
  })
}

const immersiveTexts = [
  `亲爱的陌生人：

我不知道你是谁，也不知道你是在什么样的夜晚打开了这个页面。但如果你读到了这里，我想我们之间或许有某种相似。

我们都曾在深夜里失眠，盯着天花板想一些白天不敢想的事情。我们都曾在人群中感到孤独，明明周围都是人，却觉得没有一个人真正理解自己。我们都曾在某段关系里付出全部，最后只换来一句"对不起"。

但我想告诉你的是，这些都没有关系。

孤独不是一种病，它只是灵魂在某个时刻选择了安静。那些深夜里流过的眼泪，那些没有说出口的话，那些独自走过的路，都在悄悄地塑造着一个更完整的你。

所以，如果此刻你正感到疲惫，请允许自己停下来。不需要假装坚强，不需要急着好起来。有些伤口，需要时间，需要安静，需要一个不被打扰的角落。

你已经很努力了。

晚安。`,

  `有些日子，什么也不想做。

不想起床，不想说话，不想回消息，不想假装一切都好。只想窝在被子里，听窗外的雨声，让时间像水一样从指缝间流走。

这不是懒惰，也不是消极。这只是灵魂偶尔需要按下暂停键。

我们总是被要求不停地前进、不停地努力、不停地变得更好。好像停下来就是一种罪过，好像不奔跑就会被世界抛弃。

但你有没有想过，一棵树不会因为冬天落叶就停止生长。它只是在积蓄力量，等待下一个春天。

所以，给自己一点时间吧。今天什么都不用想，什么都不用做。就只是呼吸，就只是存在。

明天的事，留给明天。`,

  `我常常想，如果时间可以倒流，我会不会做出不同的选择。

但后来我明白了，每一个"如果当初"的背后，都藏着一个不愿面对的现在。我们怀念过去，不是因为过去真的更好，而是因为过去已经结束，不再有失去的风险。

那些我们以为会永远的人，那些我们以为会一直走的路，都在某个我们没有察觉的瞬间，悄悄改变了方向。

这不是谁的错。这就是生活。

所以，与其沉溺在"如果"里，不如学会和"已经"和解。那些走过的路，爱过的人，犯过的错，都是你生命里真实发生过的事。它们不完美，但它们是你的。

而你，值得被自己温柔以待。`,

  `你有没有过这样的时刻。

消息列表很安静，窗外也很安静，房间里没有发生任何事，可你就是忽然觉得心里空了一块。不是疼，也不是崩溃，只是像有人把灯关得太早，而你还没有准备好和夜晚独处。

这种情绪最难解释。因为它不够戏剧化，不足以成为别人眼中的“大事”，却足够真实，真实到会在洗脸的时候突然发酸，在回家路上忽然沉默，在一句“我没事”之后，继续往心里沉。

后来我慢慢明白，很多难过都不是因为发生了什么，而是因为有些东西已经不再回来。`,

  `有时候你想要的不是答案。

你只是想有人坐下来，听你把一句话说完。哪怕这句话很乱，前后矛盾，甚至说到一半你自己都不知道到底在难过什么。

可现实里，我们太常被催着“快一点想清楚”“快一点走出来”“快一点正常”。久而久之，你就学会了把情绪收起来，学会了在别人问起时笑一下，说一句还好。

只是那些没被接住的感受，不会自己消失。它们会安静地留在身体里，变成某天深夜的一阵胸闷，或者一场没有来由的失眠。`,

  `你大概也有过那种突然明白的瞬间。

原来不是那个人特别坏，也不是你特别差，只是有些关系走着走着，就真的只能走到这里。你们曾经认真地靠近过，也真心地相信过以后，可后来还是散了。

最遗憾的不是分开本身，而是你后来回头看，发现很多事情其实早有征兆，只是那时候的你太舍不得，所以一次次替对方找理由，也一次次劝自己再等等。

等到最后，你终于学会放手，却也花了很久才承认，那不是释怀，那只是不得不。`,

  `成年以后，很多疲惫都没有声音。

它不会像小时候那样大哭一场，也不会有人递给你一颗糖就好了。它更像一团灰，慢慢落在每一天的表面。你照常上班，照常回消息，照常在人群里点头，可心里一直有一处在下沉。

你甚至会怀疑自己是不是太脆弱了，明明什么都没失去，为什么还是这么累。

可真正让人疲惫的，往往不是一件大事，而是太久没有被理解，太久没有停下来，也太久没有允许自己说一句：我真的已经撑了很久。`,

  `有些告别没有仪式。

它不是机场，不是站台，不是最后一次拥抱。它只是某个普通的下午，你忽然发现你们已经很久没有联系；只是某天翻开聊天记录，才意识到最后一句“下次见”已经过去了几个月。

你们谁都没有说再见，可生活已经替你们说完了。

后来你才知道，真正难忘的从来不是轰轰烈烈地结束，而是这种慢慢退出彼此生活的过程。它没有声音，却比任何一句狠话都更让人难受。`,

  `如果你今天很想逃走，也没有关系。

不是每一天都适合面对世界。不是每一次睁眼，都有力气把自己重新整理好。你可以有一点狼狈，可以先把事情放一放，可以让今天只是今天，而不是“必须振作起来的一天”。

你不是因为软弱才停下，你只是终于愿意承认，自己也需要被照顾。

人最难学会的事之一，就是在疲惫的时候不再责怪自己。`,

  `有些人离开以后，并不会立刻消失。

他们会留在你听到的歌里，留在你走过的那条路里，留在一句别人随口说出的话里。你本来以为自己已经没事了，可某个瞬间，那些旧情绪还是会毫无征兆地回来。

这不是倒退。

只是说明你曾经真心地爱过，认真地在乎过。真正被珍惜过的东西，不会因为时间过去就完全没有痕迹。它只是换了一种更安静的方式，继续留在你生命里。`,

  `世界有时候太快了。

快到你还没来得及难过，下一件事就已经推到眼前；快到你还没来得及说清楚自己的感受，就先被现实要求继续往前走。

所以你开始习惯压缩自己。压缩情绪，压缩表达，压缩那些会让人觉得“你太敏感了”的部分。

可真正的你，恰恰就在这些细小又脆弱的地方。你不是因为情绪太多才显得麻烦，而是因为你还愿意认真感受这个世界。`,

  `有时候我觉得，人和人之间最珍贵的不是热闹，而是允许。

允许你慢一点，允许你说不清楚，允许你今天不想表现得很好。允许你不是一个永远稳定的人，允许你在某些夜里，只想安静地待着，不解释，也不证明。

被允许的感觉很轻，却很重要。因为那意味着你终于不用再时刻准备成为一个“更好相处”的版本，而是可以暂时回到真正的自己。

那样的瞬间很少，但一旦拥有，就会明白温柔原来不是夸奖，而是一种空间。`,

  `我后来才明白，很多人不是不想表达，而是不知道从哪里开始。

情绪来得太快，语言总是太慢。你心里明明已经翻了很久的浪，嘴上却只能说一句“没什么”。不是敷衍，也不是冷淡，只是那些真正重要的东西，很难在第一时间被说出来。

所以如果你现在也还是说不清，那就先不要急着逼自己完整。

有时候一句断断续续的话，一个不成形的比喻，一段沉默，比一整套完整的解释更接近你的真实。`,

  `愿你以后遇到的人，不会总让你反复确认自己的价值。

愿你说出口的话不用被误解，愿你沉默的时候也不会被丢下。愿你不用每一次都靠自我消化来结束一场难过，也愿你终于能在某个夜晚安心地承认：其实我也需要被抱一抱。

如果现在还没有，也没关系。

先让自己成为那个不再轻易否定自己的人。等那一天来了，你会比任何时候都更清楚，温柔不是别人赏给你的，而是你终于学会给自己的东西。`,
]

const IMMERSIVE_MOOD_INDEX = {
  melancholy: [3, 5, 7, 9, 10],
  lonely: [0, 4, 6],
  calm: [1, 12],
  healing: [2, 8, 11, 13],
}

function initImmersive() {
  const stage = document.querySelector('.words-immersive__stage')
  const textEl = document.getElementById('immersiveText')
  if (!stage || !textEl) return

  const tagsEl = document.getElementById('wordsMoodTags')
  const toMusic = document.getElementById('wordsMoodToMusic')
  const toAI = document.getElementById('wordsMoodToAI')

  let currentMood = readEmotionFromUrl() || 'melancholy'
  let hasStarted = false

  function pickText(moodKey) {
    const k = normalizeEmotionKey(moodKey)
    if (!k) {
      const idx = Math.floor(Math.random() * immersiveTexts.length)
      return immersiveTexts[idx]
    }
    const pool = IMMERSIVE_MOOD_INDEX[k] || []
    if (pool.length === 0) {
      const idx = Math.floor(Math.random() * immersiveTexts.length)
      return immersiveTexts[idx]
    }
    const idx = pool[Math.floor(Math.random() * pool.length)]
    return immersiveTexts[idx]
  }

  function syncBridgeLinks() {
    if (toMusic) toMusic.setAttribute('href', buildUrlWithMood('/pages/music.html', currentMood))
    if (toAI) toAI.setAttribute('href', buildUrlWithMood('/pages/ai.html', currentMood))
  }

  function renderMoodTags() {
    if (!tagsEl) return
    tagsEl.innerHTML = ''
    const frag = document.createDocumentFragment()
    EMOTIONS.forEach((m) => {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = `glass-tag${currentMood === m.key ? ' active' : ''}`
      btn.dataset.mood = m.key
      btn.textContent = m.label
      frag.appendChild(btn)
    })
    tagsEl.appendChild(frag)
  }

  function startTyping() {
    const selectedText = pickText(currentMood)
    typewriter(textEl, selectedText, 50)
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          hasStarted = true
          setTimeout(() => startTyping(), 600)
          observer.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.2 }
  )

  observer.observe(stage)

  if (tagsEl) {
    renderMoodTags()
    syncBridgeLinks()
    tagsEl.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-mood]')
      if (!btn) return
      const next = normalizeEmotionKey(btn.dataset.mood)
      if (!next) return
      currentMood = next
      replaceMoodInCurrentUrl(currentMood)
      renderMoodTags()
      syncBridgeLinks()
      if (hasStarted) startTyping()
    })
  } else {
    syncBridgeLinks()
  }
}

export function initWordsPage() {
  initHeroTypewriter()
  initEssayExpand()
  initImmersive()
}
