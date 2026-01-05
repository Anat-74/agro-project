<!-- app.vue -->
<template>
  <div class="book-app">
    <!-- Контекст книги -->
    <div class="book-spine"></div>
    <div class="book-shadow"></div>
    
    <!-- Страницы -->
    <div class="book-pages">
      <NuxtPage />
    </div>
  </div>
</template>

<style>
/* ========== ОСНОВНЫЕ СТИЛИ КНИГИ ========== */
.book-app {
  position: relative;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  overflow: hidden;
}

/* Контейнер страниц */
.book-pages {
  position: relative;
  width: 90%;
  max-width: 1200px;
  min-height: 80vh;
  perspective: 3000px; /* Глубина 3D */
  transform-style: preserve-3d;
}

/* Переплет книги */
.book-spine {
  position: absolute;
  left: -20px;
  top: 0;
  bottom: 0;
  width: 40px;
  background: linear-gradient(
    to right,
    #2c3e50 0%,
    #34495e 30%,
    #2c3e50 100%
  );
  border-radius: 4px 0 0 4px;
  box-shadow: 
    inset -5px 0 10px rgba(0,0,0,0.5),
    5px 0 15px rgba(0,0,0,0.3);
  z-index: 10;
}

/* Тень от книги */
.book-shadow {
  position: absolute;
  bottom: -40px;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  height: 40px;
  background: radial-gradient(
    ellipse at center,
    rgba(0,0,0,0.3) 0%,
    transparent 70%
  );
  filter: blur(10px);
  z-index: 0;
}

/* ========== АНИМАЦИИ СТРАНИЦ ========== */
/* Текущая страница (выходит) */
.page-leave-active {
  position: absolute !important;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  animation: pageTurnOut 1.2s cubic-bezier(0.65, 0, 0.35, 1) forwards;
  transform-origin: right center;
  z-index: 3;
  transform-style: preserve-3d;
  backface-visibility: hidden;
}

/* Новая страница (входит) */
.page-enter-active {
  animation: pageTurnIn 1.2s cubic-bezier(0.65, 0, 0.35, 1) forwards;
  transform-origin: left center;
  z-index: 2;
  transform-style: preserve-3d;
  backface-visibility: hidden;
  animation-delay: 0.3s; /* Задержка для реализма */
}

/* ========== КЛЮЧЕВЫЕ КАДРЫ ========== */
@keyframes pageTurnOut {
  0% {
    /* Исходное состояние - плоская страница */
    opacity: 1;
    transform: 
      rotate3d(0, 1, 0, 0deg) 
      translate3d(0, 0, 0)
      scale3d(1, 1, 1);
    filter: 
      brightness(1) 
      blur(0)
      drop-shadow(0 5px 15px rgba(0,0,0,0.1));
    box-shadow: 
      0 0 0 rgba(0,0,0,0),
      inset 0 0 0 rgba(0,0,0,0);
  }
  
  30% {
    /* Начинаем поднимать страницу */
    transform: 
      rotate3d(0, 1, 0, -30deg)
      translate3d(0, -10px, 20px)
      scale3d(1.02, 1.02, 1);
    filter: 
      brightness(1.1)
      blur(1px)
      drop-shadow(-10px 5px 20px rgba(0,0,0,0.2));
  }
  
  60% {
    /* Пик переворота */
    transform: 
      rotate3d(0, 1, 0, -120deg)
      translate3d(-30px, -5px, 50px)
      scale3d(1.05, 1, 1);
    filter: 
      brightness(0.9)
      blur(2px)
      drop-shadow(-30px 10px 30px rgba(0,0,0,0.3));
    box-shadow: 
      inset 20px 0 30px rgba(0,0,0,0.2), /* Тень сгиба */
      -20px 10px 40px rgba(0,0,0,0.3);
  }
  
  100% {
    /* Страница ушла за корешок */
    opacity: 0;
    transform: 
      rotate3d(0, 1, 0, -180deg)
      translate3d(-60px, 0, 100px)
      scale3d(0.95, 0.98, 1);
    filter: 
      brightness(0.8)
      blur(5px)
      drop-shadow(-50px 15px 40px rgba(0,0,0,0.4));
    box-shadow: 
      inset 30px 0 50px rgba(0,0,0,0.3),
      -40px 20px 60px rgba(0,0,0,0.4);
  }
}

@keyframes pageTurnIn {
  0% {
    /* Страница за корешком */
    opacity: 0;
    transform: 
      rotate3d(0, 1, 0, 180deg)
      translate3d(60px, 0, 100px)
      scale3d(0.95, 0.98, 1);
    filter: 
      brightness(0.8)
      blur(5px)
      drop-shadow(50px 15px 40px rgba(0,0,0,0.4));
    box-shadow: 
      inset -30px 0 50px rgba(0,0,0,0.3),
      40px 20px 60px rgba(0,0,0,0.4);
  }
  
  40% {
    /* Пик переворота */
    opacity: 0.8;
    transform: 
      rotate3d(0, 1, 0, 120deg)
      translate3d(30px, -5px, 50px)
      scale3d(1.05, 1, 1);
    filter: 
      brightness(0.9)
      blur(2px)
      drop-shadow(30px 10px 30px rgba(0,0,0,0.3));
    box-shadow: 
      inset -20px 0 30px rgba(0,0,0,0.2),
      20px 10px 40px rgba(0,0,0,0.3);
  }
  
  70% {
    /* Опускаемся на место */
    opacity: 0.9;
    transform: 
      rotate3d(0, 1, 0, 30deg)
      translate3d(0, -10px, 20px)
      scale3d(1.02, 1.02, 1);
    filter: 
      brightness(1.1)
      blur(1px)
      drop-shadow(10px 5px 20px rgba(0,0,0,0.2));
  }
  
  100% {
    /* Идеально на месте */
    opacity: 1;
    transform: 
      rotate3d(0, 1, 0, 0deg)
      translate3d(0, 0, 0)
      scale3d(1, 1, 1);
    filter: 
      brightness(1)
      blur(0)
      drop-shadow(0 5px 15px rgba(0,0,0,0.1));
    box-shadow: 
      0 0 0 rgba(0,0,0,0),
      inset 0 0 0 rgba(0,0,0,0);
  }
}

/* ========== ДЕТАЛИ ЭФФЕКТА ========== */
/* Бумажная текстура для страниц */
.page-enter-active::before,
.page-leave-active::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    radial-gradient(circle at 10% 20%, rgba(255,255,255,0.1) 0.5px, transparent 0.5px),
    radial-gradient(circle at 90% 80%, rgba(255,255,255,0.1) 0.5px, transparent 0.5px);
  background-size: 50px 50px;
  pointer-events: none;
  z-index: 1;
  mix-blend-mode: overlay;
}

/* Тень от сгиба (реалистичная) */
.page-leave-active::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 60px;
  height: 100%;
  background: linear-gradient(
    to left,
    rgba(0,0,0,0.4) 0%,
    rgba(0,0,0,0.2) 30%,
    transparent 100%
  );
  z-index: 2;
  pointer-events: none;
}

/* ========== СТИЛИ СОДЕРЖАНИЯ СТРАНИЦ ========== */
/* Каждая страница имеет стиль бумаги */
:deep(.page-content) {
  background: linear-gradient(
    to bottom right,
    #fff 0%,
    #f8f9fa 100%
  );
  min-height: 80vh;
  padding: 60px;
  border-radius: 2px;
  box-shadow: 
    inset 0 0 50px rgba(0,0,0,0.05),
    0 5px 30px rgba(0,0,0,0.1);
  position: relative;
  overflow: hidden;
}

/* Эффект следа от ручки */
:deep(.page-content)::before {
  content: '';
  position: absolute;
  top: 20px;
  left: 40px;
  right: 40px;
  height: 1px;
  background: repeating-linear-gradient(
    to right,
    transparent,
    transparent 20px,
    rgba(0,0,0,0.1) 20px,
    rgba(0,0,0,0.1) 40px
  );
}

/* ========== АДАПТИВНОСТЬ ========== */
@media (max-width: 768px) {
  .book-app {
    padding: 20px;
  }
  
  .book-pages {
    width: 95%;
    perspective: 1500px;
  }
  
  .book-spine {
    left: -10px;
    width: 20px;
  }
  
  :deep(.page-content) {
    padding: 30px;
  }
  
  @keyframes pageTurnOut,
         @keyframes pageTurnIn {
    /* Упрощённая анимация на мобильных */
    100% {
      transform: rotate3d(0, 1, 0, -180deg) translate3d(-30px, 0, 50px);
    }
  }
}

/* ========== ДОСТУПНОСТЬ ========== */
@media (prefers-reduced-motion: reduce) {
  .page-enter-active,
  .page-leave-active {
    animation: none !important;
    transition: opacity 0.3s ease !important;
  }
  
  .page-enter-from,
  .page-leave-to {
    opacity: 0;
  }
}
</style>