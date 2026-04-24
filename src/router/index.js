import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '../views/HomeView.vue'
import TranslateView from '../views/TranslateView.vue'
import MusicView from '../views/MusicView.vue'
import WordsView from '../views/WordsView.vue'
import AiView from '../views/AiView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/translate', name: 'translate', component: TranslateView },
    { path: '/music', name: 'music', component: MusicView },
    { path: '/words', name: 'words', component: WordsView },
    { path: '/ai', name: 'ai', component: AiView },
  ],
})

export default router

