import { ref, unref, onMounted, onUnmounted } from "vue";
import type { Ref } from "vue";

// Web Speech API в стандартных TS-типах может отсутствовать — описываем локально
// минимум, который используем.
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

interface UseVoiceInputOptions {
  // Локаль распознавания: 'be' → be-BY, иначе ru-RU
  locale?: Ref<string> | string;
  // Колбэк с распознанным текстом (результат распознавания)
  onResult?: (text: string) => void;
}

// Переиспользуемый голосовой ввод (Web Speech API). Вынесен из
// components/chat-assistant/VoiceInput.vue, чтобы использовать и в поиске
// (шапка панели каталога), и в чате — единая логика.
// SSR-safe: доступ к window только в onMounted.
export const useVoiceInput = (options: UseVoiceInputOptions = {}) => {
  const isListening = ref(false);
  // Поддержка API (а также доступность микрофона — сбрасывается в false при
  // ошибках not-allowed / language-not-supported)
  const isSupported = ref(false);

  let recognition: SpeechRecognitionLike | null = null;

  const currentLang = () => (unref(options.locale) === "be" ? "be-BY" : "ru-RU");

  const initRecognition = () => {
    if (!isSupported.value || recognition) return;

    const Ctor =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!Ctor) return;

    recognition = new Ctor() as SpeechRecognitionLike;
    recognition.lang = currentLang();
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const text = event?.results?.[0]?.[0]?.transcript ?? "";
      options.onResult?.(text);
      isListening.value = false;
    };

    recognition.onerror = (event: any) => {
      if (
        event?.error === "not-allowed" ||
        event?.error === "language-not-supported"
      ) {
        isSupported.value = false;
      }
      isListening.value = false;
    };

    recognition.onend = () => {
      isListening.value = false;
    };
  };

  // Начать запись (если ещё не идёт)
  const start = () => {
    if (!isSupported.value || isListening.value) return;
    initRecognition();
    try {
      recognition?.start();
      isListening.value = true;
    } catch {
      isListening.value = false;
    }
  };

  // Остановить запись
  const stop = () => {
    recognition?.stop();
    isListening.value = false;
  };

  // Переключить запись (старт/стоп)
  const toggle = () => {
    if (isListening.value) stop();
    else start();
  };

  onMounted(() => {
    const Ctor =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    isSupported.value = Boolean(Ctor);
  });

  onUnmounted(() => {
    if (recognition) {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.abort();
      recognition = null;
    }
  });

  return { isListening, isSupported, start, stop, toggle };
};
