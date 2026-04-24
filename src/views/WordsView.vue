<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { EMOTIONS, buildQueryWithMood, buildUrlWithMood, getEmotionDesc, getEmotionLabel, readEmotionFromQuery } from '../../js/emotions.js'

const route = useRoute()
const router = useRouter()

const currentMood = ref(null)
const hasImmersiveStarted = ref(false)
const immersiveText = ref('')
const immersiveStageEl = ref(null)

let revealObserver = null
let immersiveObserver = null
let typingTimer = null
const pendingRevealEls = new Set()

const fragments = [
  {
    id: 'frag-2024-11-03',
    date: '2024.11.03',
    text: '后来才明白，有些人不告而别，其实已经说了再见。',
    moods: ['melancholy', 'lonely'],
  },
  {
    id: 'frag-2024-10-28',
    date: '2024.10.28',
    text: '你没有错，只是不再被需要了。',
    moods: ['lonely', 'melancholy'],
  },
  {
    id: 'frag-2024-10-15',
    date: '2024.10.15',
    text: '最怕的不是失去你，而是失去你之后，还要假装若无其事地生活。',
    moods: ['melancholy', 'lonely'],
  },
  {
    id: 'frag-2024-10-02',
    date: '2024.10.02',
    text: '我们都在等一个不会回来的人。',
    moods: ['lonely', 'melancholy'],
  },
  {
    id: 'frag-2024-09-20',
    date: '2024.09.20',
    text: '后来的我们什么都有了，却没有了我们。',
    moods: ['melancholy'],
  },
  {
    id: 'frag-2024-09-12',
    date: '2024.09.12',
    text: '我假装无所谓，才看不到心被拧碎。',
    moods: ['melancholy'],
  },
  {
    id: 'frag-2024-09-05',
    date: '2024.09.05',
    text: '人总是要和握不住的东西说再见。',
    moods: ['healing', 'calm'],
  },
  {
    id: 'frag-2024-08-28',
    date: '2024.08.28',
    text: '有些人走着走着就散了，你回头的时候，身后已经空无一人。',
    moods: ['lonely', 'melancholy'],
  },
  {
    id: 'frag-2024-08-15',
    date: '2024.08.15',
    text: '不是所有的喜欢都能得到回应，也不是所有的离开都值得挽留。',
    moods: ['calm', 'healing'],
  },
  {
    id: 'frag-2024-08-01',
    date: '2024.08.01',
    text: '深夜是一个人最诚实的时候。',
    moods: ['lonely', 'calm'],
  },
  {
    id: 'frag-2024-07-20',
    date: '2024.07.20',
    text: '我终于学会了不打扰，也学会了不回头。',
    moods: ['healing', 'calm'],
  },
  {
    id: 'frag-2024-07-08',
    date: '2024.07.08',
    text: '有些话，说给风听就好了。',
    moods: ['calm', 'healing'],
  },
]

const essays = [
  {
    id: 'essay-2024-12-01',
    date: '2024.12.01',
    title: '关于告别',
    moods: ['melancholy', 'healing'],
    paragraphs: [
      '我一直觉得，真正的告别从来不是一场郑重其事的仪式，而是在某个普通的下午，你突然发现，有些人已经很久没有出现在你的生活里了。',
      '没有争吵，没有解释，甚至没有一句再见。你们只是慢慢地不再发消息，不再分享日常，不再出现在彼此的朋友圈里。直到有一天你翻看聊天记录，才发现最后一条消息已经是三个月前。',
      '我曾经以为这种无声的离开是一种遗憾，后来才明白，这或许是最温柔的告别方式。不是所有的关系都需要一个明确的终点，有些人的出现，本身就是为了教会你一些东西，然后在合适的时候悄然退场。',
      '那些没有说出口的再见，其实都已经在心里说了一千遍。只是我们都不愿意承认，承认一段关系走到了尽头，承认有些人注定只能陪你走一段路。',
      '所以，如果你正在经历这样的告别，不必难过。那些曾经温暖过你的瞬间，不会因为离别而失去意义。它们只是换了一种方式，安静地住在你的记忆里。',
    ],
  },
  {
    id: 'essay-2024-10-18',
    date: '2024.10.18',
    title: '深夜的便利店',
    moods: ['lonely', 'calm'],
    paragraphs: [
      '凌晨两点的便利店，是城市里最诚实的地方。在这里，没有人需要伪装自己的孤独。',
      '我站在货架前，看着一排排整齐的商品，突然觉得有些恍惚。白天的这个时候，我可能正在会议室里汇报工作，或者在地铁上刷着手机，假装自己是这个城市运转正常的一个齿轮。',
      '但深夜的便利店不一样。在这里，你可以穿着拖鞋出来买一瓶水，可以盯着冰柜发呆十分钟，可以在收银台前犹豫要不要再拿一包烟。没有人催促你，没有人评判你。大家都只是深夜里睡不着的人，在寻找一点微不足道的慰藉。',
      '收银的女孩看起来很年轻，可能还是个学生。她没有问我为什么这么晚还出来买东西，只是安静地扫码、装袋、说了一句“慢走”。这种不带任何多余情感的善意，在深夜里反而让人觉得安心。',
      '走出便利店的时候，冷风灌进领口。我突然想，也许孤独并不是一件需要被治愈的事情。它只是生活的一部分，就像深夜的便利店一样，安静地亮着灯，等待每一个需要它的人。',
    ],
  },
  {
    id: 'essay-2024-08-05',
    date: '2024.08.05',
    title: '一个人看电影',
    moods: ['lonely', 'healing'],
    paragraphs: [
      '今天一个人去看了电影。买票的时候犹豫了一下，要不要选中间的位置，最后还是选了最后一排角落的座位。',
      '说实话，一个人看电影有一种奇怪的自由感。你不用在意旁边的人会不会觉得这个片段无聊，不用在笑的时候偷偷看别人有没有也在笑，也不用在哭的时候假装是在揉眼睛。你就只是看电影，纯粹地。',
      '电影散场的时候，周围的人陆续站起来离开。我坐在原位没有动，等片尾字幕走完。灯光亮起来的时候，保洁阿姨走进来开始打扫。她看了我一眼，什么也没说。',
      '走出影院的时候，外面在下雨。我没有带伞，就站在屋檐下等雨小一点。旁边也站着几个人，大家都在看手机，没有人说话。那一刻我突然觉得，这座城市里有太多像我一样的人，在雨天的屋檐下，在深夜的便利店，在凌晨的电影院里，安静地和自己的孤独相处。',
      '我们不是不快乐，只是有时候，快乐和不快乐之间，隔着一段需要一个人走完的路。',
    ],
  },
]

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

const immersiveMoodIndex = {
  melancholy: [3, 5, 7, 9, 10],
  lonely: [0, 4, 6],
  calm: [1, 12],
  healing: [2, 8, 11, 13],
}

const expandedEssayIds = ref([])

const moodLabel = computed(() => (currentMood.value ? getEmotionLabel(currentMood.value) : '全部'))
const moodDesc = computed(() => (currentMood.value ? getEmotionDesc(currentMood.value) : '你可以按情绪筛选，也可以什么都不选。'))

const filteredFragments = computed(() => {
  const k = currentMood.value
  if (!k) return fragments
  return fragments.filter((x) => Array.isArray(x.moods) && x.moods.includes(k))
})

const filteredEssays = computed(() => {
  const k = currentMood.value
  if (!k) return essays
  return essays.filter((x) => Array.isArray(x.moods) && x.moods.includes(k))
})

function isEssayExpanded(id) {
  return expandedEssayIds.value.includes(id)
}

function toggleEssay(id) {
  if (isEssayExpanded(id)) {
    expandedEssayIds.value = expandedEssayIds.value.filter((x) => x !== id)
  } else {
    expandedEssayIds.value = [...expandedEssayIds.value, id]
  }
}

function buildTranslateUrl(text) {
  const base = buildUrlWithMood('/translate', currentMood.value)
  const u = new URL(base, window.location.origin)
  if (text) u.searchParams.set('text', text)
  return u.pathname + u.search + u.hash
}

function setMood(nextMood) {
  router.replace({ query: buildQueryWithMood(route.query, nextMood) })
}

function syncMoodFromRoute() {
  currentMood.value = readEmotionFromQuery(route.query)
}

function pickImmersiveText(moodKey) {
  const k = normalizeEmotionKey(moodKey)
  if (!k) {
    const idx = Math.floor(Math.random() * immersiveTexts.length)
    return immersiveTexts[idx]
  }
  const pool = immersiveMoodIndex[k] || []
  if (pool.length === 0) {
    const idx = Math.floor(Math.random() * immersiveTexts.length)
    return immersiveTexts[idx]
  }
  const idx = pool[Math.floor(Math.random() * pool.length)]
  return immersiveTexts[idx]
}

function stopTyping() {
  if (typingTimer) {
    clearTimeout(typingTimer)
    typingTimer = null
  }
}

function typewriter(text, speed = 28) {
  stopTyping()
  immersiveText.value = ''
  const t = String(text || '')
  let i = 0

  function tick() {
    if (i >= t.length) return
    immersiveText.value += t.charAt(i)
    i += 1
    typingTimer = setTimeout(tick, speed)
  }

  tick()
}

function startImmersiveTyping() {
  const selected = pickImmersiveText(currentMood.value)
  typewriter(selected, 28)
}

function registerReveal(el) {
  if (!el) return
  if (revealObserver) {
    revealObserver.observe(el)
    return
  }
  pendingRevealEls.add(el)
}

onMounted(() => {
  syncMoodFromRoute()

  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        entry.target.classList.add('is-revealed')
        revealObserver.unobserve(entry.target)
      })
    },
    { threshold: 0.16 }
  )

  pendingRevealEls.forEach((el) => {
    revealObserver.observe(el)
  })
  pendingRevealEls.clear()

  if (immersiveStageEl.value) {
    immersiveObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          hasImmersiveStarted.value = true
          startImmersiveTyping()
          immersiveObserver.unobserve(entry.target)
        })
      },
      { threshold: 0.22 }
    )
    immersiveObserver.observe(immersiveStageEl.value)
  }
})

watch(
  () => route.query.mood,
  () => syncMoodFromRoute()
)

watch(
  () => currentMood.value,
  () => {
    if (hasImmersiveStarted.value) startImmersiveTyping()
  }
)

onBeforeUnmount(() => {
  stopTyping()
  if (revealObserver) revealObserver.disconnect()
  if (immersiveObserver) immersiveObserver.disconnect()
  revealObserver = null
  immersiveObserver = null
})
</script>

<template>
  <div class="words">
    <section class="words__hero words__reveal" :ref="registerReveal">
      <h1 class="words__title">文字</h1>
      <p class="words__subtitle">把说不清的感受，交给一句更贴近的文字。</p>
    </section>

    <section class="words__panel glass glass--surface words__reveal" :ref="registerReveal">
      <div class="words__panel-head">
        <div class="words__panel-title">当前情绪</div>
        <div class="words__panel-meta">{{ moodLabel }}</div>
      </div>
      <div class="words__panel-desc">{{ moodDesc }}</div>

      <div class="words__moods" role="group" aria-label="情绪筛选">
        <button class="words__mood glass glass--interactive" type="button" :class="{ 'is-active': !currentMood }" @click="setMood(null)">
          全部
        </button>
        <button
          v-for="m in EMOTIONS"
          :key="m.key"
          class="words__mood glass glass--interactive"
          type="button"
          :class="{ 'is-active': currentMood === m.key }"
          @click="setMood(m.key)"
        >
          {{ m.label }}
        </button>
      </div>

      <div class="words__bridge">
        <RouterLink class="words__bridge-link glass glass--interactive" :to="buildUrlWithMood('/music', currentMood)">去听同情绪</RouterLink>
        <RouterLink class="words__bridge-link glass glass--interactive" :to="buildUrlWithMood('/ai', currentMood)">去生成提示词</RouterLink>
        <RouterLink class="words__bridge-link glass glass--interactive" :to="buildUrlWithMood('/translate', currentMood)">去翻译</RouterLink>
      </div>
    </section>

    <section class="words__section words__reveal" :ref="registerReveal">
      <h2 class="words__section-title">碎片</h2>

      <div v-if="filteredFragments.length === 0" class="words__empty glass glass--surface">
        这一种情绪下暂时没有碎片。你可以换一种情绪，或回到“全部”。
      </div>

      <div v-else class="words__grid">
        <article v-for="item in filteredFragments" :key="item.id" class="words__card glass glass--surface words__reveal" :ref="registerReveal">
          <p class="words__card-text">{{ item.text }}</p>
          <div class="words__card-foot">
            <span class="words__card-date">{{ item.date }}</span>
            <RouterLink class="glass--btn words__card-btn" :to="buildTranslateUrl(item.text)">把这句交给翻译</RouterLink>
          </div>
        </article>
      </div>
    </section>

    <section class="words__section words__reveal" :ref="registerReveal">
      <h2 class="words__section-title">随笔</h2>

      <div v-if="filteredEssays.length === 0" class="words__empty glass glass--surface">
        这一种情绪下暂时没有随笔。你可以换一种情绪，或回到“全部”。
      </div>

      <div v-else class="words__essays">
        <article v-for="essay in filteredEssays" :key="essay.id" class="words__essay glass glass--surface words__reveal" :ref="registerReveal">
          <div class="words__essay-date">{{ essay.date }}</div>
          <h3 class="words__essay-title">{{ essay.title }}</h3>

          <div class="words__essay-body">
            <p v-for="(p, idx) in (isEssayExpanded(essay.id) ? essay.paragraphs : essay.paragraphs.slice(0, 2))" :key="idx">
              {{ p }}
            </p>
          </div>

          <div class="words__essay-actions">
            <button class="glass--btn words__essay-btn" type="button" @click="toggleEssay(essay.id)">
              {{ isEssayExpanded(essay.id) ? '收起' : '阅读全文' }}
            </button>
            <RouterLink class="glass--btn words__essay-btn" :to="buildTranslateUrl(essay.paragraphs[0])">用第一段做输入</RouterLink>
          </div>
        </article>
      </div>
    </section>

    <section class="words__section words__reveal" :ref="registerReveal">
      <h2 class="words__section-title words__section-title--light">沉浸</h2>
      <div class="words__immersive glass glass--surface">
        <div class="words__immersive-top">
          <div class="words__immersive-prompt">你现在更像哪一种？</div>
          <div class="words__immersive-tags" role="group" aria-label="沉浸情绪选择">
            <button class="words__tag glass glass--interactive" type="button" :class="{ 'is-active': !currentMood }" @click="setMood(null)">
              全部
            </button>
            <button
              v-for="m in EMOTIONS"
              :key="m.key"
              class="words__tag glass glass--interactive"
              type="button"
              :class="{ 'is-active': currentMood === m.key }"
              @click="setMood(m.key)"
            >
              {{ m.label }}
            </button>
          </div>
          <div class="words__immersive-links">
            <RouterLink class="glass--btn words__immersive-btn" :to="buildUrlWithMood('/music', currentMood)">去听同情绪</RouterLink>
            <RouterLink class="glass--btn words__immersive-btn" :to="buildUrlWithMood('/ai', currentMood)">去生成提示词</RouterLink>
          </div>
        </div>

        <div ref="immersiveStageEl" class="words__immersive-stage">
          <pre class="words__immersive-text">{{ immersiveText }}</pre>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.words {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding-bottom: var(--space-6);
}

.words__hero {
  padding: var(--space-4) var(--space-0);
}

.words__title {
  font-size: var(--space-font-size-5);
  color: var(--color-text-0);
  margin: var(--space-0);
}

.words__subtitle {
  margin: var(--space-1) var(--space-0) var(--space-0);
  max-width: var(--space-layout-subtitle-max-width);
  color: var(--color-text-1);
}

.words__panel {
  padding: var(--space-4);
}

.words__panel-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-2);
}

.words__panel-title {
  font-size: var(--space-font-size-2);
  color: var(--color-text-0);
}

.words__panel-meta {
  font-size: var(--space-font-size-0);
  color: var(--color-accent);
}

.words__panel-desc {
  margin-top: var(--space-1);
  color: var(--color-text-1);
}

.words__moods {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  margin-top: var(--space-2);
}

.words__mood {
  padding: var(--space-0-5) var(--space-1-5);
  border-radius: var(--radius-round);
  font-size: var(--space-font-size-0);
  color: var(--color-text-1);
  transition: background var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast);
}

.words__mood:hover {
  background: var(--color-glass-bg-hover);
  border-color: var(--color-glass-border-hover);
  color: var(--color-text-0);
}

.words__mood.is-active {
  color: var(--color-text-0);
  border-color: var(--color-glass-border-hover);
  background: var(--color-accent-alpha);
}

.words__bridge {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  margin-top: var(--space-3);
}

.words__bridge-link {
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-round);
  font-size: var(--space-font-size-0);
  color: var(--color-text-0);
  transition: background var(--transition-fast), border-color var(--transition-fast);
  border: var(--space-0-125) solid var(--color-glass-border);
  background: var(--color-glass-bg);
}

.words__bridge-link:hover {
  background: var(--color-glass-bg-hover);
  border-color: var(--color-glass-border-hover);
}

.words__section-title {
  font-size: var(--space-font-size-3);
  color: var(--color-text-0);
  margin: var(--space-0);
}

.words__section-title--light {
  color: var(--color-text-1);
}

.words__empty {
  margin-top: var(--space-2);
  padding: var(--space-3);
  color: var(--color-text-1);
}

.words__grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--space-2);
  margin-top: var(--space-3);
}

.words__card {
  grid-column: span 6;
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.words__card-text {
  margin: var(--space-0);
  color: var(--color-text-0);
  font-size: var(--space-font-size-2);
  line-height: var(--space-font-line-height-base);
}

.words__card-foot {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-1);
  flex-wrap: wrap;
}

.words__card-date {
  color: var(--color-text-2);
  font-size: var(--space-font-size-0);
}

.words__card-btn {
  font-size: var(--space-font-size-0);
  color: var(--color-text-0);
}

.words__essays {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-top: var(--space-3);
  max-width: var(--space-layout-reading-max-width);
  margin-left: auto;
  margin-right: auto;
}

.words__essay {
  padding: var(--space-4);
}

.words__essay-date {
  color: var(--color-text-2);
  font-size: var(--space-font-size-0);
}

.words__essay-title {
  margin: var(--space-1) var(--space-0) var(--space-0);
  font-size: var(--space-font-size-3);
  color: var(--color-text-0);
}

.words__essay-body {
  margin-top: var(--space-2);
  display: flex;
  flex-direction: column;
  gap: var(--space-1-5);
}

.words__essay-body p {
  margin: var(--space-0);
  color: var(--color-text-1);
}

.words__essay-actions {
  margin-top: var(--space-3);
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}

.words__essay-btn {
  font-size: var(--space-font-size-0);
  color: var(--color-text-0);
}

.words__immersive {
  margin-top: var(--space-3);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.words__immersive-top {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.words__immersive-prompt {
  color: var(--color-text-1);
  font-size: var(--space-font-size-1);
}

.words__immersive-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}

.words__tag {
  padding: var(--space-0-5) var(--space-1-5);
  border-radius: var(--radius-round);
  font-size: var(--space-font-size-0);
  color: var(--color-text-1);
  transition: background var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast);
}

.words__tag:hover {
  background: var(--color-glass-bg-hover);
  border-color: var(--color-glass-border-hover);
  color: var(--color-text-0);
}

.words__tag.is-active {
  color: var(--color-text-0);
  border-color: var(--color-glass-border-hover);
  background: var(--color-accent-alpha);
}

.words__immersive-links {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}

.words__immersive-btn {
  color: var(--color-text-0);
  font-size: var(--space-font-size-0);
}

.words__immersive-stage {
  border-radius: var(--radius-2);
  border: var(--space-0-125) solid var(--color-glass-border);
  background: var(--color-glass-bg);
  padding: var(--space-3);
  min-height: var(--space-6);
}

.words__immersive-text {
  margin: var(--space-0);
  white-space: pre-wrap;
  color: var(--color-text-0);
  font-family: var(--space-font-family-sans);
  font-size: var(--space-font-size-1);
  line-height: var(--space-font-line-height-base);
  max-width: var(--space-layout-reading-max-width);
  margin-left: auto;
  margin-right: auto;
}

.words__reveal {
  opacity: var(--space-opacity-0);
  transform: translateY(var(--space-1));
  transition: opacity var(--transition-base), transform var(--transition-base);
}

.words__reveal.is-revealed {
  opacity: var(--space-opacity-1);
  transform: translateY(var(--space-0));
}

@media (max-width: 860px) {
  .words__card {
    grid-column: span 12;
  }

  .words__card-foot {
    justify-content: flex-start;
  }

  .words__panel {
    padding: var(--space-3);
  }

  .words__essay {
    padding: var(--space-3);
  }

  .words__immersive {
    padding: var(--space-3);
  }
}
</style>
