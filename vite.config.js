import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  // 构建输出目录
  build: {
    outDir: 'dist',
    // 开启 CSS 代码分割（每个页面独立 CSS）
    cssCodeSplit: true,
    // 资源内联阈值（4KB 以内内联为 base64）
    assetsInlineLimit: 4096,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        ai: resolve(__dirname, 'pages/ai.html'),
        music: resolve(__dirname, 'pages/music.html'),
        'game-art': resolve(__dirname, 'pages/game-art.html'),
        words: resolve(__dirname, 'pages/words.html'),
        kook: resolve(__dirname, 'pages/kook.html'),
        about: resolve(__dirname, 'pages/about.html'),
      },
      output: {
        // 手动 chunk 分割策略
        manualChunks: {
          // 公共基础层：全局 CSS 变量、重置、基础组件
          'shared-base': ['./css/global.css', './css/glass.css', './css/animations.css'],
          // 导航与背景：所有页面共享
          'shared-nav': ['./css/nav.css', './css/background.css'],
          // JS 公共入口
          'shared-js': ['./js/main.js', './js/nav.js'],
        },
      },
    },
  },

  // CSS 预处理配置
  css: {
    // 开启 CSS source map（开发环境）
    devSourcemap: true,
  },

  // 开发服务器配置
  server: {
    open: true,
    host: true,
  },
})
