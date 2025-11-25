<template>
   <div>
<span>Store Location: Lincoln- 344, Illinois, Chicago, USA</span>
      <ClientOnly>
        <ColorMode class="color-mode" />
      </ClientOnly>
         <LangSwitcher  class="lang-switcher"/>
   </div>
</template>

<style lang="scss" scoped>
div {
   display: grid;
   grid-template-columns: 1fr repeat(2,auto);
   align-items: center;
   column-gap: toRem(12);
   background-color: var(--primary-color);
   @include adaptiveValue("height", 40, 35);
}
.lang-switcher {

}
</style>