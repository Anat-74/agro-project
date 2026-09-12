<script setup lang="ts">
// UI-обёртка над useVoiceInput (Web Speech API) для чат-ассистента.
// Логика распознавания — в composables/useVoiceInput.ts (переиспользуется в поиске).
const props = defineProps<{
  disabled: boolean
  locale: string
  // Прозрачный фон кнопки (для использования внутри поля поиска)
  transparent?: boolean
}>()

const emit = defineEmits<{
  onResult: [text: string]
}>()

const { isListening, isSupported, toggle } = useVoiceInput({
  locale: toRef(props, 'locale'),
  onResult: (text) => emit('onResult', text),
})
</script>

<template>
  <ChatAssistantButton
    v-if="isSupported"
    variant="voice"
    :is-listening="isListening"
    :icon="isListening ? 'material-symbols:mic-off' : 'material-symbols:mic'"
    :is-disabled="disabled"
    :transparent="transparent"
    :aria-label="isListening ? 'Остановить запись' : 'Голосовой ввод'"
    @click="toggle"
  />
</template>
