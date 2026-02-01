<script setup lang="ts">

const active = ref(false)
const toggleActive = () => {
   active.value = !active.value
}
</script>

<template>
   <div>
   <div 
   @click="toggleActive"
   class="card"
   >
      <div 
         :class="['card__front', { card__front_front: active}]"
      >
      <span>Front</span>
      </div>
      <div 
         :class="['card__back', { card__back_back: active }]"
      >
         <span>Back</span>
      </div>
   </div>
</div>
</template>

<style lang="scss" scoped>

.card {
   position: relative;
   width: 20%;
   perspective: toRem(500);
   @include adaptiveValue("height", 400, 200);

   &__front,
   &__back {
      position: absolute;
      inset: 0;
      padding: toRem(12);
      font-size: toRem(16);
      backface-visibility: hidden;
      border-radius: .6rem;
      color: var(--gray-color);
      background-color: transparent;
      transition: transform .9s;
      box-shadow: 0px toEm(6, 15) toEm(18, 15) toRem(5) hsla(0, 0%, 0%, 0.07);
   }

   &__front {
      @media (max-width:$tablet){
         
      }
         &_front {
         transform: rotateY(180deg);
      }
   }

   &__back {
      transform: rotateY(180deg);

         &_back {
         transform: rotateY(360deg);
      }
   }

   @media (min-width:$tablet){
      @include hover {
         .card__front {
            transform: rotateY(180deg);
         }
         .card__back {
            transform: rotateY(360deg);
            }
      }
   }
}
</style>