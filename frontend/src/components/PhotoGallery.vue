<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import PhotoCard from './PhotoCard.vue'
import Lightbox from './Lightbox.vue'

const props = defineProps({
  token: { type: String, required: true },
})
const emit = defineEmits(['logout'])

// ─── State ────────────────────────────────────────────────────────────────
const categories = ref([])
const activeTab = ref('')
const loading = ref(true)
const loadError = ref('')
const selectedIds = ref(new Set())
const lightboxPhoto = ref(null)
const downloading = ref(false)
const downloadError = ref('')

// ─── Derived ──────────────────────────────────────────────────────────────
const activeCategory = computed(() =>
  categories.value.find((c) => c.id === activeTab.value)
)

const activePhotos = computed(() => activeCategory.value?.photos ?? [])

const selectedInActive = computed(() =>
  activePhotos.value.filter((p) => selectedIds.value.has(p.id))
)

const allActiveSelected = computed(
  () =>
    activePhotos.value.length > 0 &&
    activePhotos.value.every((p) => selectedIds.value.has(p.id))
)

const totalSelected = computed(() => selectedIds.value.size)

// ─── Load photos ──────────────────────────────────────────────────────────
onMounted(fetchPhotos)

async function fetchPhotos() {
  loading.value = true
  loadError.value = ''
  try {
    const res = await fetch('/api/photos', {
      headers: { 'X-Gallery-Token': props.token },
    })

    if (res.status === 401) {
      emit('logout')
      return
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error ?? `HTTP ${res.status}`)
    }

    const data = await res.json()
    categories.value = data.categories ?? []
    if (categories.value.length > 0) activeTab.value = categories.value[0].id
  } catch (err) {
    loadError.value = err.message ?? 'Fout bij het laden van foto\'s.'
  } finally {
    loading.value = false
  }
}

// ─── Selection ────────────────────────────────────────────────────────────
function toggleSelect(photoId) {
  const next = new Set(selectedIds.value)
  if (next.has(photoId)) next.delete(photoId)
  else next.add(photoId)
  selectedIds.value = next
}

function toggleSelectAll() {
  const next = new Set(selectedIds.value)
  if (allActiveSelected.value) {
    activePhotos.value.forEach((p) => next.delete(p.id))
  } else {
    activePhotos.value.forEach((p) => next.add(p.id))
  }
  selectedIds.value = next
}

function clearSelection() {
  selectedIds.value = new Set()
}

// ─── Lightbox ─────────────────────────────────────────────────────────────
function openLightbox(photo) {
  lightboxPhoto.value = photo
}

function lightboxNav(direction) {
  const photos = activePhotos.value
  const idx = photos.findIndex((p) => p.id === lightboxPhoto.value?.id)
  if (idx === -1) return
  const next = idx + direction
  if (next >= 0 && next < photos.length) lightboxPhoto.value = photos[next]
}

// ─── Download ─────────────────────────────────────────────────────────────
async function downloadSelected() {
  if (totalSelected.value === 0) return
  downloading.value = true
  downloadError.value = ''

  const photoIds = [...selectedIds.value]

  try {
    const res = await fetch('/api/download', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Gallery-Token': props.token,
      },
      body: JSON.stringify({ photos: photoIds }),
    })

    if (res.status === 401) {
      emit('logout')
      return
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error ?? `HTTP ${res.status}`)
    }

    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'vrijzinnige-feesten-2026.zip'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (err) {
    downloadError.value = err.message ?? 'Download mislukt. Probeer opnieuw.'
  } finally {
    downloading.value = false
  }
}

// Clear download error after tab switch
watch(activeTab, () => { downloadError.value = '' })
</script>

<template>
  <div class="gallery">

    <!-- Loading state -->
    <div v-if="loading" class="gallery-loading">
      <span class="spinner spinner-dark" aria-hidden="true" />
      <p>Foto's laden…</p>
    </div>

    <!-- Error state -->
    <div v-else-if="loadError" class="gallery-error">
      <p>⚠️ {{ loadError }}</p>
      <button class="btn btn-secondary" @click="fetchPhotos" style="margin-top:16px">
        Opnieuw proberen
      </button>
    </div>

    <!-- Gallery -->
    <template v-else-if="categories.length">
      <!-- Category tabs -->
      <div class="tabs-wrap" role="tablist" aria-label="Categorieën">
        <button
          v-for="cat in categories"
          :key="cat.id"
          role="tab"
          :aria-selected="activeTab === cat.id"
          :class="['tab-btn', { 'tab-btn--active': activeTab === cat.id }]"
          @click="activeTab = cat.id"
        >
          <span class="tab-icon" aria-hidden="true">{{ cat.icon }}</span>
          <span class="tab-name">{{ cat.name }}</span>
          <span class="tab-count">{{ cat.photos.length }}</span>
        </button>
      </div>

      <!-- Toolbar -->
      <div class="toolbar">
        <div class="toolbar-left">
          <label class="select-all-label" :title="allActiveSelected ? 'Deselecteer alles' : 'Selecteer alles in deze categorie'">
            <input
              type="checkbox"
              :checked="allActiveSelected"
              :indeterminate="selectedInActive.length > 0 && !allActiveSelected"
              @change="toggleSelectAll"
              class="sr-only"
            />
            <span class="select-all-box" :class="{ 'select-all-box--checked': allActiveSelected, 'select-all-box--partial': selectedInActive.length > 0 && !allActiveSelected }" aria-hidden="true">
              <svg v-if="allActiveSelected" viewBox="0 0 20 20" fill="none">
                <path d="M4 10l4 4 8-8" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <svg v-else-if="selectedInActive.length > 0" viewBox="0 0 20 20" fill="none">
                <path d="M5 10h10" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
              </svg>
            </span>
            <span class="select-all-text">
              {{ allActiveSelected ? 'Alles gedeselecteerd' : 'Alles selecteren' }}
            </span>
          </label>

          <span v-if="activePhotos.length > 0" class="photo-count">
            {{ activePhotos.length }} foto{{ activePhotos.length === 1 ? '' : '\'s' }}
          </span>
        </div>

        <div class="toolbar-right">
          <button
            v-if="totalSelected > 0"
            class="btn btn-ghost clear-btn"
            @click="clearSelection"
          >
            Selectie wissen
          </button>
          <button
            class="btn btn-primary download-btn"
            :disabled="totalSelected === 0 || downloading"
            @click="downloadSelected"
          >
            <span v-if="downloading" class="spinner" aria-hidden="true" />
            <span v-if="downloading">Downloaden…</span>
            <span v-else-if="totalSelected === 0">📥 Download selectie</span>
            <span v-else>📥 Download {{ totalSelected }} foto{{ totalSelected === 1 ? '' : '\'s' }}</span>
          </button>
        </div>
      </div>

      <!-- Download error -->
      <div v-if="downloadError" class="download-error" role="alert">
        ⚠️ {{ downloadError }}
      </div>

      <!-- Photo grid -->
      <div
        v-if="activePhotos.length > 0"
        class="photo-grid"
        role="tabpanel"
        :aria-label="activeCategory?.name"
      >
        <PhotoCard
          v-for="photo in activePhotos"
          :key="photo.id"
          :photo="photo"
          :selected="selectedIds.has(photo.id)"
          @toggle-select="toggleSelect"
          @open="openLightbox"
        />
      </div>

      <!-- Empty category -->
      <div v-else class="gallery-empty">
        <p>📂 Nog geen foto's in deze categorie.</p>
      </div>
    </template>

    <!-- Lightbox -->
    <Lightbox
      v-if="lightboxPhoto"
      :photo="lightboxPhoto"
      :photos="activePhotos"
      :token="token"
      @close="lightboxPhoto = null"
      @navigate="lightboxNav"
    />
  </div>
</template>

<style scoped>
.gallery {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 16px 48px;
}

/* ─── Loading / error / empty ─── */
.gallery-loading,
.gallery-error,
.gallery-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 80px 16px;
  text-align: center;
  color: var(--text-muted);
  font-size: 1rem;
}

.gallery-error {
  color: var(--error);
}

/* ─── Tabs ─── */
.tabs-wrap {
  display: flex;
  gap: 4px;
  padding: 24px 0 0;
  border-bottom: 2px solid var(--border);
  overflow-x: auto;
  scrollbar-width: none;
}

.tabs-wrap::-webkit-scrollbar {
  display: none;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 0.9rem;
  font-weight: 500;
  border-radius: var(--radius) var(--radius) 0 0;
  border-bottom: 3px solid transparent;
  margin-bottom: -2px;
  transition: color var(--transition), background var(--transition), border-color var(--transition);
  white-space: nowrap;
  cursor: pointer;
}

.tab-btn:hover {
  color: var(--primary);
  background: var(--primary-light);
}

.tab-btn--active {
  color: var(--primary-dark);
  font-weight: 700;
  border-bottom-color: var(--accent);
  background: var(--primary-light);
}

.tab-icon {
  font-size: 1.1rem;
}

.tab-count {
  background: var(--border);
  color: var(--text-muted);
  border-radius: 20px;
  padding: 1px 8px;
  font-size: 0.78rem;
  font-weight: 600;
}

.tab-btn--active .tab-count {
  background: var(--accent-light);
  color: var(--accent-dark);
}

/* ─── Toolbar ─── */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 0;
  flex-wrap: wrap;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.select-all-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text);
  user-select: none;
}

.select-all-box {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: 2px solid var(--border);
  border-radius: 5px;
  background: var(--surface);
  transition: background var(--transition), border-color var(--transition);
  flex-shrink: 0;
}

.select-all-box svg {
  width: 14px;
  height: 14px;
}

.select-all-box--checked {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

.select-all-box--partial {
  background: var(--accent-light);
  border-color: var(--accent);
  color: var(--accent);
}

.photo-count {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.clear-btn {
  font-size: 0.875rem;
  padding: 8px 14px;
}

.download-btn {
  font-size: 0.95rem;
  padding: 10px 20px;
}

/* ─── Download error ─── */
.download-error {
  background: var(--error-light);
  color: var(--error);
  border-radius: var(--radius);
  padding: 12px 16px;
  font-size: 0.9rem;
  margin-bottom: 8px;
}

/* ─── Photo grid ─── */
.photo-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

@media (max-width: 1024px) {
  .photo-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 700px) {
  .photo-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .tab-btn {
    padding: 10px 14px;
  }

  .tab-name {
    display: none;
  }

  .tab-icon {
    font-size: 1.3rem;
  }

  .tab-count {
    display: block;
  }
}

@media (max-width: 420px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar-right {
    flex-direction: column;
  }

  .download-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
