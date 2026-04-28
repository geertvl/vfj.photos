<script setup>
import { computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  photo:  { type: Object, required: true },
  photos: { type: Array,  required: true },
  token:  { type: String, required: true },
})
const emit = defineEmits(['close', 'navigate'])

const currentIndex = computed(() =>
  props.photos.findIndex((p) => p.id === props.photo.id)
)
const hasPrev = computed(() => currentIndex.value > 0)
const hasNext = computed(() => currentIndex.value < props.photos.length - 1)

function onKeyDown(e) {
  if (e.key === 'Escape') emit('close')
  if (e.key === 'ArrowLeft' && hasPrev.value) emit('navigate', -1)
  if (e.key === 'ArrowRight' && hasNext.value) emit('navigate', 1)
}

onMounted(() => {
  document.addEventListener('keydown', onKeyDown)
  document.body.style.overflow = 'hidden'
})
onUnmounted(() => {
  document.removeEventListener('keydown', onKeyDown)
  document.body.style.overflow = ''
})

async function downloadPhoto() {
  try {
    const res = await fetch(props.photo.url)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = props.photo.filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch {
    // Fallback: open in new tab
    window.open(props.photo.url, '_blank', 'noopener')
  }
}
</script>

<template>
  <div
    class="lightbox"
    role="dialog"
    aria-modal="true"
    :aria-label="'Foto ' + (currentIndex + 1) + ' van ' + photos.length"
    @click.self="emit('close')"
  >
    <!-- Header bar -->
    <div class="lb-header">
      <span class="lb-counter">{{ currentIndex + 1 }} / {{ photos.length }}</span>
      <span class="lb-filename">{{ photo.filename }}</span>
      <div class="lb-actions">
        <button class="lb-btn" title="Foto downloaden" @click="downloadPhoto">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          <span class="lb-btn-label">Downloaden</span>
        </button>
        <button class="lb-btn lb-btn-close" title="Sluiten (Esc)" @click="emit('close')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
          <span class="lb-btn-label">Sluiten</span>
        </button>
      </div>
    </div>

    <!-- Navigation + image -->
    <div class="lb-body">
      <button
        class="lb-nav lb-nav-prev"
        :disabled="!hasPrev"
        aria-label="Vorige foto"
        @click="emit('navigate', -1)"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>

      <div class="lb-image-wrap">
        <img
          :src="photo.url"
          :alt="photo.filename"
          class="lb-image"
        />
      </div>

      <button
        class="lb-nav lb-nav-next"
        :disabled="!hasNext"
        aria-label="Volgende foto"
        @click="emit('navigate', 1)"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.lightbox {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.92);
  display: flex;
  flex-direction: column;
}

/* ─── Header ─── */
.lb-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(0,0,0,0.6);
  color: #fff;
  flex-shrink: 0;
}

.lb-counter {
  font-size: 0.85rem;
  color: rgba(255,255,255,0.6);
  white-space: nowrap;
}

.lb-filename {
  flex: 1;
  font-size: 0.9rem;
  color: rgba(255,255,255,0.8);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lb-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.lb-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  color: #fff;
  border-radius: 8px;
  padding: 8px 14px;
  font-family: inherit;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background var(--transition);
}

.lb-btn svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.lb-btn:hover {
  background: rgba(255,255,255,0.22);
}

.lb-btn-close {
  background: rgba(192, 57, 43, 0.4);
  border-color: rgba(192, 57, 43, 0.6);
}

.lb-btn-close:hover {
  background: rgba(192, 57, 43, 0.7);
}

/* ─── Body / image ─── */
.lb-body {
  flex: 1;
  display: flex;
  align-items: center;
  overflow: hidden;
  min-height: 0;
}

.lb-image-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 16px 0;
  overflow: hidden;
}

.lb-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 4px;
  box-shadow: 0 4px 32px rgba(0,0,0,0.5);
}

/* ─── Navigation arrows ─── */
.lb-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border: none;
  background: rgba(255,255,255,0.08);
  color: #fff;
  border-radius: 50%;
  cursor: pointer;
  margin: 0 8px;
  flex-shrink: 0;
  transition: background var(--transition), opacity var(--transition);
}

.lb-nav svg {
  width: 28px;
  height: 28px;
}

.lb-nav:hover:not(:disabled) {
  background: rgba(255,255,255,0.2);
}

.lb-nav:disabled {
  opacity: 0.2;
  cursor: default;
}

/* ─── Responsive ─── */
@media (max-width: 600px) {
  .lb-btn-label {
    display: none;
  }

  .lb-btn {
    padding: 8px;
  }

  .lb-nav {
    width: 48px;
    height: 48px;
    margin: 0 4px;
  }

  .lb-nav svg {
    width: 22px;
    height: 22px;
  }
}
</style>
