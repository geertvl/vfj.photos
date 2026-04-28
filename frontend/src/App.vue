<script setup>
import { ref, computed, onMounted } from 'vue'
import PasswordGate from './components/PasswordGate.vue'
import PhotoGallery from './components/PhotoGallery.vue'

const token = ref('')

function parseJwtExp(t) {
  try {
    return JSON.parse(atob(t.split('.')[1])).exp * 1000
  } catch {
    return 0
  }
}

function isExpired(t) {
  return !t || parseJwtExp(t) < Date.now()
}

onMounted(() => {
  const stored = localStorage.getItem('vfj_token') ?? ''
  if (!isExpired(stored)) token.value = stored
})

const isAuthenticated = computed(() => !!token.value)

function handleAuthenticated(newToken) {
  token.value = newToken
  localStorage.setItem('vfj_token', newToken)
}

function handleLogout() {
  token.value = ''
  localStorage.removeItem('vfj_token')
}
</script>

<template>
  <div id="app">
    <header class="site-header">
      <div class="header-inner">
        <div class="header-brand">
          <img
            src="/logo.png"
            alt="Vrijzinnig Groot-Lier logo"
            class="header-logo"
            @error="$event.target.style.display = 'none'"
          />
          <div class="header-title">
            <span class="header-org">Vrijzinnig Groot-Lier</span>
            <span class="header-event">Vrijzinnige Feesten 2026 – Foto's</span>
          </div>
        </div>
        <button v-if="isAuthenticated" class="btn-logout" @click="handleLogout">
          Afmelden
        </button>
      </div>
    </header>

    <main class="site-main">
      <PasswordGate
        v-if="!isAuthenticated"
        @authenticated="handleAuthenticated"
      />
      <PhotoGallery
        v-else
        :token="token"
        @logout="handleLogout"
      />
    </main>

    <footer class="site-footer">
      © 2026 Vrijzinnig Groot-Lier &mdash;
      <a href="https://www.vrijzinniggrootlier.be" target="_blank" rel="noopener">
        vrijzinniggrootlier.be
      </a>
    </footer>
  </div>
</template>
