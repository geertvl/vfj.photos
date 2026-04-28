<script setup>
defineProps({
  photo: { type: Object, required: true },
  selected: { type: Boolean, default: false },
})

const emit = defineEmits(['toggle-select', 'open'])
</script>

<template>
  <div
    class="photo-card"
    :class="{ 'photo-card--selected': selected }"
    role="figure"
  >
    <!-- Selection checkbox (large tap target) -->
    <label class="photo-select" :title="selected ? 'Deselecteer' : 'Selecteer foto'">
      <input
        type="checkbox"
        class="sr-only"
        :checked="selected"
        @change="emit('toggle-select', photo.id)"
      />
      <span class="photo-check" aria-hidden="true">
        <svg v-if="selected" viewBox="0 0 20 20" fill="none">
          <path d="M4 10l4 4 8-8" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>
    </label>

    <!-- Thumbnail -->
    <button class="photo-thumb-btn" @click="emit('open', photo)" :title="'Foto vergroten: ' + photo.filename">
      <img
        :src="photo.url"
        :alt="photo.filename"
        class="photo-thumb"
        loading="lazy"
        decoding="async"
      />
    </button>
  </div>
</template>

<style scoped>
.photo-card {
  position: relative;
  border-radius: var(--radius);
  overflow: hidden;
  background: var(--border);
  aspect-ratio: 4 / 3;
  transition: box-shadow var(--transition), transform var(--transition);
}

.photo-card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

.photo-card--selected {
  box-shadow: 0 0 0 3px var(--accent), var(--shadow);
}

.photo-thumb-btn {
  display: block;
  width: 100%;
  height: 100%;
  border: none;
  background: none;
  padding: 0;
  cursor: zoom-in;
}

.photo-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.2s;
}

.photo-thumb-btn:hover .photo-thumb {
  opacity: 0.9;
}

/* Selection checkbox */
.photo-select {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 10;
  cursor: pointer;
}

.photo-check {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 2.5px solid #fff;
  background: rgba(0, 0, 0, 0.35);
  color: #fff;
  transition: background var(--transition), border-color var(--transition);
  box-shadow: 0 1px 4px rgba(0,0,0,0.3);
}

.photo-check svg {
  width: 16px;
  height: 16px;
}

.photo-card--selected .photo-check {
  background: var(--accent);
  border-color: var(--accent);
}

.photo-select:hover .photo-check {
  background: rgba(0, 0, 0, 0.55);
  border-color: #fff;
}

.photo-card--selected .photo-select:hover .photo-check {
  background: var(--accent-dark);
  border-color: var(--accent-dark);
}
</style>
