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
]

function initImmersive() {
  const stage = document.querySelector('.words-immersive__stage')
  const textEl = document.getElementById('immersiveText')
  if (!stage || !textEl) return

  const randomIndex = Math.floor(Math.random() * immersiveTexts.length)
  const selectedText = immersiveTexts[randomIndex]

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            typewriter(textEl, selectedText, 50)
          }, 600)
          observer.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.2 }
  )

  observer.observe(stage)
}

export function initWordsPage() {
  initHeroTypewriter()
  initEssayExpand()
  initImmersive()
}
