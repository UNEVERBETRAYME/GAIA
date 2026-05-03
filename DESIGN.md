# GAIA DESIGN.md

> 此文件供 AI 工具读取，定义 GAIA 的视觉与交互规范。
> 所有规则来自 css/global.css、trae/rules/gaia.md、css/glass.css——已有实现，不是愿景。

---

## 1 · 视觉主题与氛围

| 维度 | 值 |
|------|------|
| 气质关键词 | 深夜 · 安静 · 安全感 · 玻璃拟态 |
| 密度 | 低。大面积留白，一次一个焦点 |
| 底色 | 深空黑 `#0a0a0f`，次级 `#0f0f17`，卡片 `#161625` |
| 核心语言 | 毛玻璃——`backdrop-filter: blur()` + 半透明背景 + 模糊边框 |
| 情绪隐喻 | 雾蓝为唯一强调色。所有颜色"感受到而非注意到" |

禁止：纯黑 `#000`、纯白 `#fff`、高饱和色。

---

## 2 · 色彩系统

| Token | 值 | 角色 |
|------|------|------|
| `--bg-primary` | `#0a0a0f` | 最深底色 |
| `--bg-secondary` | `#0f0f17` | 次级背景 |
| `--bg-tertiary` | `#161625` | 卡片区域 |
| `--glass-bg` | `rgba(255,255,255,0.04)` | 玻璃默认背景 |
| `--glass-bg-hover` | `rgba(255,255,255,0.08)` | 玻璃悬浮 |
| `--glass-border` | `rgba(255,255,255,0.08)` | 玻璃边框 |
| `--glass-border-hover` | `rgba(255,255,255,0.16)` | 玻璃悬浮边框 |
| `--text-primary` | `rgba(255,255,255,0.87)` | 主文字 |
| `--text-secondary` | `rgba(255,255,255,0.58)` | 副文字 |
| `--text-tertiary` | `rgba(255,255,255,0.32)` | 弱文字/标签 |
| `--accent-fog-blue` | `#6e8fad` | 雾蓝——唯一强调色 |
| `--accent-fog-blue-alpha` | `rgba(110,143,173,0.25)` | 雾蓝半透明 |
| `--accent-smoke-purple` | `#8878a8` | 烟紫（仅音乐页） |
| `--accent-ink-cyan` | `#5d8a87` | 墨青（极少用） |
| `--accent-mist-rose` | `#97788a` | 雾玫（极少用） |

**色彩法则**：所有组件用 CSS 变量，禁止硬编码 hex/rgba。JS 中颜色/渐变值也必须用 `var(--xxx)`。

---

## 3 · 字体体系

| 层级 | 字体 | 字重 | 字号 | 字间距 | 行高 |
|------|------|------|------|------|------|
| 英文 | `'Josefin Sans', sans-serif` | 300 | — | — | — |
| 中文 | `'Noto Sans SC', sans-serif` | 300 | — | — | — |
| 全站基础 | 继承 | `var(--font-weight)` = 300 | 16px | `var(--ls-base)` = 2px | 1.8 |
| 大标题（首页） | 继承 | 300 | `clamp(2rem, 5vw, 3.5rem)` | `var(--ls-hero)` = 10px | 1.6 |
| 页面标题 | 继承 | 300 | `clamp(1.4rem, 4vw, 2rem)` | `var(--ls-title)` = 5px | 1.6 |
| 正文 | 继承 | 300 | 0.88rem | 2px | 1.8 |
| 弱字/免责 | 继承 | 300 | 10px | 0.04em | — |

**强制规则**：全站禁止粗体——`font-weight` 全局继承 300。`b` 和 `strong` 也被重置为 300。

---

## 4 · 组件样式

### 玻璃卡片 `.glass-card`
- 背景 `var(--glass-bg)`，毛玻璃 `blur(18px) saturate(1.15)`
- 边框 `1px solid var(--glass-border)`，圆角 `var(--radius)` = 16px
- 阴影 `var(--shadow-soft)` + `var(--shadow-inset)`
- 伪元素顶部渐变光条 + 右上角径向光斑
- hover：上移 -2px，背景 `var(--glass-bg-hover)`，阴影升级

### 大卡片 `.glass-card-lg`
- 同 `.glass-card`，圆角 `var(--radius-lg)` = 24px，模糊 `24px`

### 导航 `.glass-nav`
- 固定顶部，高度 `var(--nav-h)` = 72px
- 背景 `rgba(10,10,15,0.65)`，`blur(20px) saturate(1.2)`
- 底部 1px 玻璃边框，伪元素顶部高光线
- z-index: 1000

### 按钮 `.glass-btn`
- 胶囊形 `border-radius: 999px`，内边距 `10px 30px`
- hover：上移 -1px，边框变雾蓝色，阴影加深
- 强调变体 `.glass-btn-accent`：雾蓝底 `rgba(110,143,173,0.1)`

### 输入框 `.glass-input`
- 底部边框风格，2px 线条
- 默认透明背景 `rgba(255,255,255,0.02)`
- focus：底部边框变雾蓝 `--accent-fog-blue`

### 标签 `.glass-tag`
- 行内块，小圆角，半透明背景

### MoB（音乐播放器 mini-bar）
- 底部固定，高度 88px
- 左侧封面图 48x48，中间曲目信息，右侧控制按钮
- 封面缺失时用 `--gradient-song-*` 渐变填充

---

## 5 · 布局系统

| 维度 | 值 |
|------|------|
| 最大内容宽度 | `--max-w` = 1200px |
| 导航高度 | `--nav-h` = 72px |
| 间距阶梯 | 8 / 16 / 28 / 48 / 80 / 120 px |
| 圆角阶梯 | 12 / 16 / 24 px |
| 网格 | flex 为主，无 float，无 position absolute 布局 |
| 响应式策略 | 弹性 padding + `clamp()`字体 + 必要时单列 |
| 触控目标 | ≥ 44px |

---

## 6 · 深度与阴影

| Token | 值 | 用途 |
|------|------|------|
| `--shadow-soft` | `0 8px 32px rgba(0,0,0,0.35)` | 卡片默认 |
| `--shadow-elevated` | `0 16px 48px rgba(0,0,0,0.4)` | 卡片 hover / 弹窗 |
| `--shadow-glow` | `0 0 24px rgba(110,143,173,0.08)` | 雾蓝微光 |
| `--shadow-inset` | `inset 0 1px 0 rgba(255,255,255,0.08)` | 玻璃内高光 |
| `--glass-highlight` | `rgba(255,255,255,0.12)` | 玻璃顶部渐变 |
| `--glass-shadow-edge` | `rgba(5,8,18,0.42)` | 玻璃暗边 |

表面层级：导航(z=1000) > 音乐 mini-bar > 内容卡片 > 底色。

---

## 7 · 设计红线

**禁止：**
- ❌ 纯黑 `#000` / 纯白 `#fff` / 高饱和色
- ❌ 硬编码颜色值——所有颜色用 CSS 变量
- ❌ `font-weight: bold` / `font-weight: 700`——全站字重 300
- ❌ 动画用 `linear` / `bounce` / 旋转 / 缩放
- ❌ UI 库 / Tailwind / TypeScript / Nuxt
- ❌ 心理咨询话术 / 客服话术：「我理解你」「建议你」

**必须：**
- ✅ 每次代码修改后 `npm run build` 零错误
- ✅ 删文件后跑 build 确认无引用断裂
- ✅ 修改 CSS 变量或类名后模板/样式双向 grep
- ✅ 写 CSS 想着用户可能在流泪——选更安静的方案
- ✅ 安全红线上有 `400-161-9995` 热线，不交给 AI 处理

---

## 8 · 响应式行为

| 断点 | 行为 |
|------|------|
| 全尺寸 | 弹性 padding，字体用 `clamp()` |
| ≤ 768px | 导航标签隐藏，仅图标；音乐页列表改单列 |
| 触控设备 | 按钮最小 44px 触控区；iOS safe-area 适配 |

---

## 9 · AI 工具引导

### 快速色卡
```
底色 #0a0a0f  ·  卡片 #161625  ·  玻璃 rgba(255,255,255,0.04)
主字 rgba(255,255,255,0.87)  ·  副字 rgba(255,255,255,0.58)
强调 #6e8fad (雾蓝)
```

### 常用指令
```bash
npm run dev      # → http://localhost:5173
npm run build    # 改完必跑
npm run preview
```

### 项目规则文件
`.trae/rules/gaia.md`——Agent 操作模式、自收录迭代规则、Git 备忘。

> **重要**：System prompt 禁止放完整输出示例（25% 模板复制事故）。安全关键词检测在本地 `hasSelfHarmRisk()` 执行。
