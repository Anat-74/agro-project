
<template>
 <div class="animate-items">
		<h2 class="animate-items__title">TechnoMars</h2>
		<h2 class="animate-items__title">TechnoMars</h2>
		<h2 class="animate-items__title">TechnoMars</h2>
		</div> 
</template>

<style lang="scss" scoped>
		.animate-items {
         &__title {
			position: absolute;
			left:50%;
			top: 50%;
         translate: -50% -50%;
         letter-spacing: 1.2px;
         font-weight: 600;

         &:nth-child(1) {
         color: transparent;
			-webkit-text-stroke: 1px var(--main-color);
			filter: blur(.3px);

         }
         &:nth-child(2) {
            z-index: 10;
			   color: #03a9f4;
			   animation: animate-title 5s ease-in-out infinite;
         }
         &:nth-child(3) {
            z-index: 10;
			   color: rgba(127, 113, 99, .3);
			// filter: drop-shadow(0 25px 5px #fff);
         }
		}
	}
		@keyframes animate-title {
			0%,
			100% {
				clip-path: polygon(0% 56%, 3% 53%, 7% 48%, 11% 42%, 16% 37%, 23% 36%, 29% 35%, 34% 37%, 40% 40%, 45% 44%, 49% 48%, 53% 52%, 57% 57%, 60% 61%, 64% 67%, 69% 71%, 74% 71%, 78% 68%, 80% 62%, 83% 59%, 85% 54%, 90% 51%, 93% 47%, 97% 43%, 99% 38%, 100% 98%, 0% 98%);
			}
			50% {
				clip-path: polygon(0% 63%, 3% 59%, 8% 59%, 11% 62%, 18% 66%, 23% 68%, 30% 66%, 35% 64%, 38% 60%, 42% 58%, 45% 55%, 49% 53%, 53% 49%, 60% 46%, 64% 44%, 68% 42%, 73% 40%, 78% 39%, 81% 37%, 85% 36%, 89% 33%, 91% 29%, 94% 27%, 97% 25%, 100% 21%, 100% 100%, 0% 99%);
			}
		}
</style>