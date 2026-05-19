<script setup lang="ts">
const props = defineProps<{
  disabled: boolean
  locale: string
}>()

const emit = defineEmits<{
  onResult: [text: string]
}>()

const isListening = ref(false)
const micVisible = ref(true)

// Проверка поддержки Web Speech API
const SpeechRecognitionAPI = window.SpeechRecognition || (window as any).webkitSpeechRecognition
const isSupported = Boolean(SpeechRecognitionAPI)

if (!isSupported) {
  micVisible.value = false
}

let recognition: any = null

const initRecognition = () => {
  if (!isSupported || recognition) return

  recognition = new SpeechRecognitionAPI()
  recognition.lang = props.locale === 'be' ? 'be-BY' : 'ru-RU'
  recognition.interimResults = false
  recognition.maxAlternatives = 1

  recognition.onresult = (event: any) => {
    const text = event.results[0][0].transcript
    emit('onResult', text)
    isListening.value = false
  }

  recognition.onerror = (event: any) => {
    if (event.error === 'not-allowed' || event.error === 'language-not-supported') {
      micVisible.value = false
    }
    isListening.value = false
  }

  recognition.onend = () => {
    isListening.value = false
  }
}

const toggleListening = () => {
  if (isListening.value) {
    recognition?.stop()
    isListening.value = false
    return
  }

  initRecognition()

  try {
    recognition?.start()
    isListening.value = true
  } catch {
    isListening.value = false
  }
}

onUnmounted(() => {
  if (recognition) {
    recognition.onresult = null
    recognition.onerror = null
    recognition.onend = null
    recognition.abort()
    recognition = null
  }
})
</script>

<template>
  <button
    v-if="micVisible"
    class="voice-input"
    :class="{ 'voice-input--listening': isListening }"
    :disabled="disabled"
    @click="toggleListening"
    :aria-label="isListening ? 'Остановить запись' : 'Голосовой ввод'"
    type="button"
  >
    <Icon :name="isListening ? 'material-symbols:mic-off' : 'material-symbols:mic'" />
  </button>
</template>

<style scoped lang="scss">
.voice-input {
  @include adaptiveValue("width", 40, 34);
  @include adaptiveValue("height", 40, 34);
  border-radius: 50%;
  border: toRem(1) solid var(--border-color);
  background: var(--light-color);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-duration);
  flex-shrink: 0;
  color: var(--gray-color);

  @include hover {
    &:not(:disabled) {
      border-color: var(--success-color);
      color: var(--success-color);
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &--listening {
    background: var(--danger-color);
    color: var(--light-color);
    border-color: var(--danger-color);
    animation: pulse 1.5s infinite;
  }
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(244, 67, 54, 0.4); }
  50% { box-shadow: 0 0 0 toRem(8) rgba(244, 67, 54, 0); }
}
</style>
