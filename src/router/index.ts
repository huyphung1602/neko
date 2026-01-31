import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue')
  },
  {
    path: '/decks',
    name: 'decks',
    component: () => import('@/views/DecksView.vue')
  },
  {
    path: '/decks/:id',
    name: 'deck-detail',
    component: () => import('@/views/DeckDetailView.vue')
  },
  {
    path: '/cards/new',
    name: 'card-new',
    component: () => import('@/views/CardEditView.vue')
  },
  {
    path: '/cards/:id',
    name: 'card-edit',
    component: () => import('@/views/CardEditView.vue')
  },
  {
    path: '/review',
    name: 'review',
    component: () => import('@/views/ReviewView.vue')
  },
  {
    path: '/review/:deckId',
    name: 'review-deck',
    component: () => import('@/views/ReviewView.vue')
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/views/SettingsView.vue')
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
