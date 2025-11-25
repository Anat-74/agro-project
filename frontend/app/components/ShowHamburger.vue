<script setup lang="ts">
const dialogElement = useTemplateRef<HTMLDialogElement>('dialog-hamburger')

// const { open, close } = useDialog(dialogElement) - проработать, что бы и по методу show() все работало
const openDialog = () => {
      dialogElement.value?.show()
   }

const closeDialog = () => {
   dialogElement.value?.close()
}
</script>

<template>
   <UButton 
   @click="openDialog" 
   variant="hamburger"
   aria-label="open"
   />
   <dialog 
   class="dialog-hamburger"
   ref="dialog-hamburger"
   id="dialogHamburger" 
   aria-label="Контакты" 
   >
     <div class="dialog-hamburger__items">
         <UButton 
         @click="closeDialog"
         variant="hamburger"
         aria-label="closed"
          />
         <p>В процессе наполнения контентом...</p>
         <p>In the process of filling with content...</p>
     </div>
   </dialog>
 </template>

<style lang="scss" scoped>
.dialog-hamburger {
   display: block;
   z-index: 9999;
   height: auto;
   border-radius: toRem(4);
   margin-inline-start: toRem(0);
   scale: 0;
   border: toRem(2) solid var(--active-color);
   border-top: none;
   background-color: transparent;
   backdrop-filter: blur(5px);
   transition: scale .1s linear;
   @include adaptiveValue("width", 210, 140);

  &[open] {
   scale: 1;
   transition: scale .1s linear;
  }

  &__items {
   position: relative;
   padding-inline: toEm(12, 16);
   padding-block-start: toEm(16, 16);
   padding-block-end: toEm(18, 16);
  }
   p {
      font-weight: 600;
      font-size: toEm(20);
      margin-block-end: toRem(16);
      color: #ffffff;
   }
}

@keyframes fade {
   0% {
      opacity: 0;
   }
   100% {
      opacity: .9;
   }
}
</style>