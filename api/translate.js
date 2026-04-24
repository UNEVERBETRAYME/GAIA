const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
const API_URL = 'https://api.deepseek.com/chat/completions'
const TIMEOUT_MS = 8000

const SYSTEM_PROMPT = `你是 GAIA 的情绪翻译器。只输出一个 JSON 对象，不要任何解释、前缀、后缀。

必须返回的 JSON 结构：
{
  "moodPrimary": "melancholy/calm/healing/lonely 四选一",
  "moodSecondary": ["最多两个，可选空数组"],
  "intensity": 0到100的整数,
  "empathy": "一句共情表达，不超过25个字",
  "oneLine": "核心翻译句，第二人称你",
  "rewrites": {
    "short": "短句版，20字以内",
    "long": "长句版，40-80字",
    "dialogue": "对话版，像在对朋友说话"
  },
  "prompts": {
    "image": "英文AI图像提示词，描述画面氛围",
    "music": "中文音乐推荐描述"
  }
}

风格要求：
- 克制、文学性、不煽情
- 用第二人称"你"
- 不要套话开头的共情句（如"听起来你…""我懂你…"）
- 每个 value 必须针对用户输入重新创作，禁止任何形式的复制`

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!DEEPSEEK_API_KEY) {
    return res.status(200).json({ fallback: true, reason: 'API key not configured' })
  }

  const { text } = req.body || {}
  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Missing text' })
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const apiRes = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: text },
        ],
        temperature: 0.7,
        max_tokens: 512,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    })

    clearTimeout(timer)

    if (apiRes.status !== 200) {
      const errBody = await apiRes.text().catch(() => '')
      const isContentFilter =
        errBody.includes('content_filter') ||
        errBody.includes('sensitive')

      if (isContentFilter) {
        return res.status(200).json({ fallback: true, reason: 'content_filter' })
      }

      return res.status(200).json({ fallback: true, reason: `HTTP ${apiRes.status}` })
    }

    const json = await apiRes.json()
    const content = json.choices?.[0]?.message?.content || ''
    const finishReason = json.choices?.[0]?.finish_reason || ''

    if (finishReason === 'content_filter') {
      return res.status(200).json({ fallback: true, reason: 'content_filter' })
    }

    const parsed = JSON.parse(content)
    return res.status(200).json({ fallback: false, result: parsed })
  } catch (err) {
    clearTimeout(timer)
    const reason = err.name === 'AbortError' ? 'timeout' : 'network_error'
    return res.status(200).json({ fallback: true, reason })
  }
}
