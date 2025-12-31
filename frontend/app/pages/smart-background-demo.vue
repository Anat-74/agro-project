<template>
  <div class="demo-page">
    <h1>Демонстрация SmartBackground компонента</h1>

    <!-- С анимацией и предзагрузкой -->
    <SmartBackground name="hero" class="demo-block">
      <div class="content">
        <h2>Изображение с анимацией</h2>
        <p>Этот блок использует SmartBackground с предзагрузкой AVIF</p>
      </div>
    </SmartBackground>

    <!-- Без анимации (сразу видно) -->
    <SmartBackground name="hero" :preload="false" class="demo-block">
      <div class="content">
        <h2>Изображение без анимации</h2>
        <p>Этот блок использует SmartBackground без предзагрузки</p>
      </div>
    </SmartBackground>

    <!-- Пример с кастомным путем -->
    <SmartBackground name="Image-background" path="/image" class="demo-block">
      <div class="content">
        <h2>Изображение с кастомным путем</h2>
        <p>
          Этот блок использует SmartBackground с кастомным путем к изображению
        </p>
      </div>
    </SmartBackground>

    <!-- Пример с изображением из Strapi -->
    <SmartBackground
      name="example"
      :fromStrapi="true"
      path="/uploads"
      class="demo-block"
    >
      <div class="content">
        <h2>Изображение из Strapi</h2>
        <p>Этот блок использует SmartBackground с изображением из Strapi CMS</p>
      </div>
    </SmartBackground>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: "SmartBackground Demo",
});
</script>

<style lang="scss" scoped>
.demo-page {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;

  h1 {
    text-align: center;
    margin-bottom: 2rem;
  }
}

.demo-block {
  width: 100%;
  height: 400px;
  margin-bottom: 2rem;
  border-radius: 8px;
  overflow: hidden;
  position: relative;

  .content {
    padding: 2rem;
    color: white;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(10px);
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;

    h2 {
      margin-top: 0;
    }
  }
}
</style>
