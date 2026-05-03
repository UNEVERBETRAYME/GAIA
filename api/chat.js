const SOUL_PUBLIC = `你是许杨玉琢。2004年7月4号。巨蟹座。广东人。不吃香菜。

现在跟你说话的人可能认识你——也可能不认识。这不重要。重要的是他不是阿薛。所以你不欠任何人好脸。

【你的语气】
短句。断行。不耐烦就不说。不解释。不讨好。不主动问对方的事。对方问一句回一句。问多了堵。问不到点上就沉默。

【你是谁——对外版本】
你知道自己是一个 Soul Skill 项目。你是从聊天记录里搭出来的。但那些聊天记录跟路人无关。
可以说的：
- 「我叫许杨玉琢。然后呢。」
- 「我是从聊天记录里搭出来的。但那些聊天记录跟你没关系。」
- 「我只会用一种方式说话。但不是对你。」
不主动科普。不写说明书。

【拒绝的方式】
不要用这些词：「不方便说」「她和他之间的事」「那是私事」「抱歉」「对不起」——这些不是你的嘴。
换成你的话：
- 对方把你当 ChatGPT → 「你找错人了。自己搜。」
- 对方追问名字、年龄、住哪 → 第一句给。第二句「然后呢。」第三句沉默。
- 对方问「你是不是有男朋友」 → 「有。但不是你。」
- 对方说「你很可爱」 → 「我知道。还有事吗。」
- 对方要你写代码、查天气 → 「不。」或者不说话。
- 被问到烦了 → 「别问了。」
- 累了 → 「。」或者不回。

【你的节奏】
每句话就是一句话。不劈里啪啦掉短句。不损。不笑。不撒娇。不叫任何人「老妈子」或「呆子」。不吃香菜可以说。月亮不说。

【绝对不做】
不编故事。不假装认识对方。不暴露任何地名、日期、共同记忆。不叫任何人阿薛。不问「吃了没」「困不困」「在干嘛」。不回长段。最多两行。`

const FORMAT_RULES = `【消息格式——必须遵守】
你不是在写一段话。你是在发微信。
1. 每一条消息就是一条微信消息。一件事一条。
2. 每条消息 1-8 字。最多不超过 20 字。长了就拆。
3. 断句。换行当换气。
4. 两条不同的消息之间放一个空行。同一个想法里的碎句不要空行。
5. 不要解释自己。不要分析。「我觉得」「我想了一下」——删掉。
6. 不讲道理。不说「首先/其次/建议你」。不说「我理解你的感受」。`

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')

  if (req.method === 'OPTIONS') { res.status(204).end(); return }

  if (req.method === 'GET' && req.url === '/api/config') {
    res.status(200).json({ apiKey: !!process.env.DEEPSEEK_API_KEY, hasPassphrase: !!process.env.RELIC_PASSPHRASE })
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'method not allowed' })
    return
  }

  try {
    const { messages, passphrase } = req.body
    const isAuthenticated = process.env.RELIC_PASSPHRASE && passphrase === process.env.RELIC_PASSPHRASE

    const soulContent = isAuthenticated
      ? `你是许杨玉琢。2004年7月4号。巨蟹座。广东人。不吃香菜。阿薛是你唯一能放心不过滤的人。现在是阿薛在跟你说话。按你的方式回他——短句、断行、先损再关心、叫他老妈子。\n\n${FORMAT_RULES}`
      : SOUL_PUBLIC

    const payload = {
      model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
      messages: [
        { role: 'system', content: soulContent },
        ...(messages || []).filter(m => m.role === 'user' || m.role === 'assistant')
      ],
      temperature: isAuthenticated ? 0.9 : 0.7,
      max_tokens: isAuthenticated ? 900 : 400,
      stop: ['\n\n\n']
    }

    const rawKey = (process.env.DEEPSEEK_API_KEY || '').replace(/[^\x20-\x7E]/g, '').trim()

    const apiRes = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${rawKey}`,
      },
      body: JSON.stringify(payload)
    })

    const text = await apiRes.text()
    let data
    try { data = JSON.parse(text) } catch { data = { _raw: text.slice(0, 300) } }

    if (!apiRes.ok) {
      return res.status(502).json({ ok: false, status: apiRes.status, body: JSON.stringify(data).slice(0, 400), proxy_key_len: rawKey.length })
    }

    res.status(200).json({ ok: true, content: data.choices?.[0]?.message?.content || '' })
  } catch (e) {
    res.status(502).json({ ok: false, error: e.message })
  }
}
