# GAIA 网站图片使用指南

## 一、图片格式策略

### 推荐格式优先级

| 优先级 | 格式 | 适用场景 | 优势 |
|--------|------|----------|------|
| 1 | **WebP** | 所有图片的首选格式 | 比 JPEG 小 25-35%，支持透明度 |
| 2 | **AVIF** | 现代浏览器（Chrome 85+, Firefox 93+） | 比 WebP 再小 20% |
| 3 | **JPEG** | 老浏览器 fallback | 兼容性最好 |
| 4 | **PNG** | 需要透明度的图标/装饰 | 无损，但体积大 |

### `<picture>` 标签模板

替换占位图时，使用以下模板确保兼容性：

```html
<picture>
  <!-- AVIF（最优先） -->
  <source srcset="/img/your-image.avif" type="image/avif">
  <!-- WebP（主流） -->
  <source srcset="/img/your-image.webp" type="image/webp">
  <!-- JPEG（兜底） -->
  <img
    src="/img/your-image.jpg"
    alt="描述文字"
    loading="lazy"
    decoding="async"
    width="800"
    height="500"
  >
</picture>
```

### 背景图（CSS 中使用）

CSS 中无法使用 `<picture>`，建议直接使用 WebP 并提供 fallback：

```css
.element {
  background-image: url('/img/your-image.webp');
  background-image: -webkit-image-set(
    url('/img/your-image.webp') type('image/webp'),
    url('/img/your-image.jpg') type('image/jpeg')
  );
  background-image: image-set(
    url('/img/your-image.webp') type('image/webp'),
    url('/img/your-image.jpg') type('image/jpeg')
  );
}
```

---

## 二、图片懒加载

### 已添加 lazy loading 的元素

| 页面 | 元素 | 说明 |
|------|------|------|
| game-art.html | 8 张画廊截图 | `loading="lazy"` + `decoding="async"` |
| game-art.html | 6 张角色头像 | `loading="lazy"` + `decoding="async"` |
| music.html | 3 张歌单封面 | `loading="lazy"` + `decoding="async"` |

### 渐进显示（配合 JS）

当替换为真实 `<img>` 标签后，建议添加淡入效果：

```html
<img
  src="/img/photo.webp"
  alt="描述"
  loading="lazy"
  decoding="async"
  class="lazy-image"
  onload="this.classList.add('loaded')"
>
```

```css
.lazy-image {
  opacity: 0;
  transition: opacity 0.6s ease;
}
.lazy-image.loaded {
  opacity: 1;
}
```

---

## 三、各页面图片建议尺寸

### 首页（index.html）
| 元素 | 建议尺寸 | 比例 | 说明 |
|------|----------|------|------|
| Hero 背景 | 1920×1080 | 16:9 | 如需背景图，当前使用纯 CSS 渐变 |

### AI 板块（ai.html）
| 元素 | 建议尺寸 | 比例 | 说明 |
|------|----------|------|------|
| AI 工具卡片封面 | 600×400 | 3:2 | 瀑布流展示，宽度 600px 足够 |
| 弹窗大图 | 1200×800 | 3:2 | 高清展示 |

### 情绪音乐（music.html）
| 元素 | 建议尺寸 | 比例 | 说明 |
|------|----------|------|------|
| 播放器封面 | 400×400 | 1:1 | 正方形，已用 200×200 显示 |
| 歌单封面 | 400×240 | 5:3 | 卡片顶部封面图 |
| 心情推荐小图 | 112×112 | 1:1 | 圆角小图 |

### 第九艺术（game-art.html）
| 元素 | 建议尺寸 | 比例 | 说明 |
|------|----------|------|------|
| 画廊截图 | 800×500 | 16:10 | 主力展示尺寸 |
| 画廊截图（竖版）| 600×800 | 3:4 | 竖版游戏截图 |
| 画廊截图（4:3）| 800×600 | 4:3 | 老游戏截图 |
| 弹窗大图 | 1600×1000 | 16:10 | 全屏查看用 |
| 角色头像 | 440×340 | 约 4:3 | 横向滚动卡片 |

### 伤感文字（words.html）
| 元素 | 建议尺寸 | 比例 | 说明 |
|------|----------|------|------|
| 无图片元素 | - | - | 纯文字页面，无需图片 |

### Kook 社区（kook.html）
| 元素 | 建议尺寸 | 比例 | 说明 |
|------|----------|------|------|
| Hero 背景 | 1920×800 | 约 2.4:1 | 如需背景图，当前使用渐变 |

### 关于（about.html）
| 元素 | 建议尺寸 | 比例 | 说明 |
|------|----------|------|------|
| 头像 | 240×240 | 1:1 | 圆形裁剪，显示 120×120 |

---

## 四、推荐压缩工具

### 在线工具（免费）

| 工具 | 地址 | 特点 |
|------|------|------|
| **Squoosh** | https://squoosh.app | Google 出品，支持 WebP/AVIF 转换，可视化对比 |
| **TinyPNG** | https://tinypng.com | 批量压缩 PNG/JPEG，免费版每月 500 张 |
| **iLoveIMG** | https://iloveimg.com | 批量处理，支持压缩/裁剪/格式转换 |
| **Convertio** | https://convertio.co | 300+ 格式互转，支持 AVIF 输出 |

### 本地工具

| 工具 | 平台 | 特点 |
|------|------|------|
| **ImageOptim** | macOS | 拖拽批量压缩，无损优化 |
| **Sharp** | Node.js | 编程式压缩，可集成到构建流程 |
| **mozjpeg** | CLI | JPEG 最优压缩，比标准 JPEG 小 5-15% |

### Vite 插件（构建时自动压缩）

如需在构建时自动压缩图片，可安装：

```bash
npm install -D vite-plugin-imagemin
```

然后在 `vite.config.js` 中添加：

```javascript
import viteImagemin from 'vite-plugin-imagemin'

export default defineConfig({
  plugins: [
    viteImagemin({
      gifsicle: { optimizationLevel: 7 },
      optipng: { optimizationLevel: 7 },
      mozjpeg: { quality: 75 },
      webp: { quality: 75 },
      svgo: {
        plugins: [{ removeViewBox: false }],
      },
    }),
  ],
})
```

> **注意**：`vite-plugin-imagemin` 首次构建较慢（需下载二进制），建议仅在生产构建时启用。

---

## 五、图片目录结构建议

```
/public
  /img
    /gallery/          # 第九艺术画廊截图
      rdr2-1.webp
      cyberpunk-1.webp
      zelda-1.webp
      ...
    /characters/       # 角色头像
      arthur.webp
      sam.webp
      link.webp
      ...
    /music/            # 音乐封面
      album-1.webp
      album-2.webp
      ...
    /about/            # 关于页
      avatar.webp
    /ai/               # AI 板块
      tool-1.webp
      ...
```

> 使用 `/public` 目录而非 `/src/assets`，因为 Vite MPA 中 HTML 文件直接引用 public 目录的资源。

---

## 六、性能指标参考

| 指标 | 目标值 | 说明 |
|------|--------|------|
| 单张画廊图片 | < 150KB | WebP 格式，800px 宽 |
| 角色头像 | < 50KB | WebP 格式，440px 宽 |
| 歌单封面 | < 80KB | WebP 格式，400px 宽 |
| 关于页头像 | < 30KB | WebP 格式，240px 宽 |
| 首屏总图片体积 | < 300KB | 控制首屏加载时间 |
| 全站图片总量 | < 2MB | 所有页面图片总和 |
