<template>
   <div class="banner">
<span class="banner__content">
   Store Location: Kolasa - 34, Minsk, Belarus</span>
      <ClientOnly>
        <ColorMode class="banner__color-mode hidden-tablet" />
      </ClientOnly>
         <LangSwitcher  class="banner__lang-switcher hidden-tablet"/>
   </div>
</template>

<style lang="scss" scoped>
.banner {
   overflow-x: auto;
   display: grid;
   align-items: center;
   padding-inline: toRem(4);
   background-color: var(--primary-color);
   @include adaptiveValue("height", 40, 35);

   @media (min-width:$tablet){
   grid-template-columns: 1fr repeat(2,auto);
   column-gap: toRem(12);
   padding-inline: toRem(12);
   }


   &__content {
      @media (max-width:$mobileSmall){
          width: toRem(474); 
      }
   }

	&__color-mode {
   opacity: 0;
   animation: fadeIn 0.3s ease-in-out 0.1s forwards;
	}
	&__lang-switcher {
	}
}
@keyframes fadeIn {
  to {
    opacity: 1;
  }
}

</style>