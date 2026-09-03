<template>
   <div class="loader">
     <span/>
     <span/>
     <span/>
   </div>
 </template>
 
 <style lang="scss" scoped>
 .loader {
   // Самодостаточный лоадер: ВСЕГДА вне потока и по центру вьюпорта
   // (чуть выше геометрического центра — top 40%). Родителю НЕ нужны стили:
   // достаточно поставить <ULoader v-if/v-show="…" /> в любом месте разметки.
   position: fixed;
   top: 40%;
   left: 50%;
   translate: -50% -50%;
   z-index: 1000;
   width: toRem(80);
   height: toRem(80);

   span {
     display: inline-block;
     position: absolute;
     left: toRem(8);
     width: toRem(16);
     height: toRem(64);
     background-color: var(--sky-blue);
     animation: loader-animate 1.2s cubic-bezier(0, .5, .5, 1) infinite;
   }
   span:nth-child(1) { left: toRem(8);  animation-delay: -.24s; }
   span:nth-child(2) { left: toRem(32); animation-delay: -.12s; }
   span:nth-child(3) { left: toRem(56); animation-delay: 0; }
 }

 @keyframes loader-animate {
   0% {
     top: toRem(8);
     height: toRem(64);
   }
   100% {
     top: toRem(24);
     height: toRem(32);
   }
 }
 </style>
