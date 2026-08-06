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
const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
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
  <ChatAssistantButton
    v-if="micVisible"
    variant="voice"
    :is-listening="isListening"
    :icon="isListening ? 'material-symbols:mic-off' : 'material-symbols:mic'"
    :is-disabled="disabled"
    :aria-label="isListening ? 'Остановить запись' : 'Голосовой ввод'"
    @click="toggleListening"
  />
</template>

