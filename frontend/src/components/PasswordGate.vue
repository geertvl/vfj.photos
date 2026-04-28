<script setup>
import { ref } from 'vue'

const emit = defineEmits(['authenticated'])

const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleSubmit() {
  if (!password.value.trim()) return

  error.value = ''
  loading.value = true

  try {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: password.value }),
    })

    const data = await res.json()

    if (res.ok && data.token) {
      emit('authenticated', data.token)
    } else {
      error.value = data.error ?? 'Aanmelden mislukt. Probeer opnieuw.'
      password.value = ''
    }
  } catch {
    error.value = 'Geen verbinding met de server. Probeer later opnieuw.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="gate-wrap">
    <div class="gate-card">
      <div class="gate-icon" aria-hidden="true">📷</div>
      <h1 class="gate-title">Vrijzinnige Feesten 2026</h1>
      <p class="gate-sub">Voer het wachtwoord in om de foto's te bekijken.</p>

      <form class="gate-form" @submit.prevent="handleSubmit" novalidate>
        <label for="password" class="gate-label">Wachtwoord</label>
        <input
          id="password"
          v-model="password"
          type="password"
          class="gate-input"
          :class="{ 'gate-input--error': error }"
          placeholder="Wachtwoord"
          autocomplete="current-password"
          autofocus
          :disabled="loading"
          @keydown.enter.prevent="handleSubmit"
        />

        <div v-if="error" class="gate-error" role="alert">
          <span aria-hidden="true">⚠️</span> {{ error }}
        </div>

        <button type="submit" class="btn btn-primary gate-btn" :disabled="loading || !password">
          <span v-if="loading" class="spinner" aria-hidden="true" />
          <span>{{ loading ? 'Aanmelden…' : 'Aanmelden' }}</span>
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.gate-wrap {
  min-height: calc(100vh - 80px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
}

.gate-card {
  background: var(--surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: 48px 40px;
  width: 100%;
  max-width: 420px;
  text-align: center;
}

.gate-icon {
  font-size: 3rem;
  margin-bottom: 12px;
}

.gate-title {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--primary-dark);
  margin-bottom: 8px;
  line-height: 1.25;
}

.gate-sub {
  color: var(--text-muted);
  font-size: 0.95rem;
  margin-bottom: 32px;
}

.gate-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-align: left;
}

.gate-label {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text);
}

.gate-input {
  width: 100%;
  padding: 14px 16px;
  border: 2px solid var(--border);
  border-radius: var(--radius);
  font-size: 1.05rem;
  font-family: inherit;
  color: var(--text);
  background: var(--surface);
  transition: border-color var(--transition), box-shadow var(--transition);
  outline: none;
}

.gate-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(30, 77, 140, 0.15);
}

.gate-input--error {
  border-color: var(--error);
}

.gate-input--error:focus {
  box-shadow: 0 0 0 3px rgba(192, 57, 43, 0.15);
}

.gate-error {
  background: var(--error-light);
  color: var(--error);
  border-radius: var(--radius);
  padding: 10px 14px;
  font-size: 0.9rem;
  font-weight: 500;
}

.gate-btn {
  width: 100%;
  justify-content: center;
  padding: 14px;
  font-size: 1.05rem;
  margin-top: 4px;
}

@media (max-width: 480px) {
  .gate-card {
    padding: 32px 24px;
  }
}
</style>
