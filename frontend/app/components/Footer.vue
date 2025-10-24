<script setup lang="ts">
import type { FooterData, LegalInfo, SocialLink, Email, Phone } from "@/types/types"
import { baseFooterTranslations } from '~/locales/baseFooter'

const { currentLocale } = useLocale()
const config = useRuntimeConfig()
const { formatPhone } = useFormatPhone()

defineProps<{
   footer: FooterData
   legal: LegalInfo
   socials: SocialLink[]
   email: Email[]
   phones: Phone[]
}>()

</script>

<template>
   <footer class="base-footer">
      <div class="base-footer__container">
         <NuxtLink class="base-footer__logo"
         :to="`/${currentLocale}`">
      <NuxtImg
         v-if="footer.logo?.length"
         :src="`${config.public.strapi.url}${footer.logo[0]?.url}`"
         :alt="footer.companyName"
         format="webp"
         width="62"
         height="55"
         loading="lazy"
         class="base-footer__logo"
         aria-label="Go home"
    />
   </NuxtLink>

    <div class="base-footer__socials"
    v-if="socials"
   >
   <a
   v-for="link in socials" 
   :key="link.id"
    :href="link.href" 
    target="_blank"
    >
      <NuxtImg 
         v-if="link.icon"
        :src="`${config.public.strapi.url}${link.icon[0]?.url}`"
        :alt="link.label"
        width="26"
        height="26"
      />
    </a>
   </div>
    <div class="base-footer__company company"
    >
      <h2 class="company__title">{{ baseFooterTranslations[currentLocale].titleCompany }}</h2>
      <strong 
      v-if="footer.companyName"
      class="company__name">{{ footer.companyName }}</strong>
      <span 
      v-if="footer.taxId"
      class="company__tax-id">{{footer.taxId}}</span>
      <span 
      v-if="footer.workingHours"
      class="company__woring-hours">
         <Icon
         name="mingcute:calendar-time-add-line" height="22"
         />
         {{ footer.workingHours }}</span>
      <p 
      v-if="footer.legalAdress"
      class="company__legal-adress">
         <Icon name="entypo:address"
         />
         {{ footer.legalAdress }}</p>

      <div
      class="company__phones"
      v-for="item in phones" 
      :key="item.id"
      >
         <Icon
          v-if="item.isMobile"
         name="et:phone"
         />

         <Icon
          v-if="!item.isMobile"
         name="carbon:phone-ip"
         />
    <a
    :href="`tel:${item.phoneNumber.replace(/[^0-9+]/g, '')}`"
    class="company__link-phones"
    >{{ formatPhone(item.phoneNumber) }}
    </a>
   </div>
   <div 
      class="company__email"
      v-for="item in email" 
     :key="item.id"
   >
      <Icon
       v-if="item.isEmail"
         name="material-symbols:mail-outline"
         />
    <a
     v-if="item.isEmail"
      :href="`mailto:${item.email}`"
      class="company__link-email"
    >
    {{ item.email }}
    </a>
   </div>
    </div>

   <NavigationFooter class="base-footer__navigation"/>
   <div class="base-footer__legal legal">
      <h2 class="legal__title">{{ baseFooterTranslations[currentLocale].titleLegal }}</h2>
   <strong 
   v-if="legal.bankName"
   class="legal__name">{{ legal.bankName }}</strong>
  <p 
  v-if="legal.bankAddress"
  class="legal__address">
   <Icon
      name="mdi:address-marker-outline"
      />
   {{ legal.bankAddress }}</p>
  <span 
  v-if="legal.accountNumber"
  class="legal__account">{{ legal.accountNumber }}</span>
  <span 
  v-if="legal.swiftCode"
  class="legal__swift">{{legal.swiftCode}}</span>
</div>
<span 
v-if="footer.copyright"
class="base-footer__copyright">{{footer.copyright}}</span>
</div>
<ScrollToTop />
   </footer>
</template>

<style lang="scss" scoped>
.base-footer {
   margin-block-start: toEm(16);
   background-color:var(--bg-footer-color);
   @include adaptiveValue("padding-block", 22, 12);

&__container {
   display: grid;
   grid-template-columns: 1fr auto 1fr;
   row-gap: toEm(9);
   grid-template-areas: 
   'logo logo socials'
   'company nav legal'
   'copyr copyr ..'
   ;
   font-size: toEm(15);

   @media (max-width:$mobile){
      grid-template-columns: 1fr auto;
      grid-template-areas: 
      'logo socials'
      'company nav'
      'legal legal'
      'copyr copyr'
      ;
   }
}

&__logo {
   grid-area: logo;
   align-self: center;
   justify-self: start;
   border-radius: toEm(8);
   padding: toEm(3);
   background-color: var(--light-color);
   transition: all var(--transition-duration);

   @media (max-width:$mobile){
      width: toRem(48); 
   }

   @include hover {
      border-radius: 48%;
      outline: 1px solid var(--border-color);
   }
}

&__socials {
   grid-area: socials;
   justify-self: end;
   align-self: center;
   display: flex;
   column-gap: toRem(12);

   img {
      transition: scale var(--transition-duration);
      @include hover {
         scale: 1.2;
   }
   }
}

&__company {
   grid-area: company;
}

&__navigation {
   grid-area: nav;
   justify-self: center;
   align-self: center;
   background-color: var(--bg-nav-footer);
}

&__legal {
   grid-area: legal;
   justify-self: end;
   @media (max-width:$mobile){
      justify-self: start;
   }
}

&__copyright {
   grid-area: copyr;
   margin-inline-end: toRem(44);
   margin-block-start: toRem(16);
}
}

.company {
   display: flex;
   flex-direction: column;
   row-gap: toEm(8);
   color: var(--color);
   padding-inline-end: toEm(22);

&__title {
   margin-block-end: toEm(1);
   color: var(--light-color);
}

&__name {
   font-size: toEm(15);
}

&__tax-id {
   display: block;
}


&__woring-hours {
   svg {
      translate: 0 toRem(5);
      color: var(--forest-green-color);;
   }
}

&__legal-adress {
   svg {
      translate: 0 toRem(3);
      color: var(--dark-golden-color);
   }
}

&__phones {
   align-self: start;
   display: flex;
   align-items: center;
   column-gap: toRem(2);
   transition: all var(--transition-duration);

   .iconify--et {
   translate: toRem(2) 0;
   margin-inline-end: toRem(7);
   color: var(--color);
   }

   svg {
      color: var(--primary-color);
   }

   @include hover {
      color: var(--dark-color);
      svg {
      color: var(--warning-color);
   }
   }
}

&__email {
   align-self: start;
   display: flex;
   align-items: center;
   column-gap: toRem(5);
   transition: all var(--transition-duration);
   svg {
      color: var(--sky-blue-color);
   }

   @include hover {
      color: var(--dark-color);
      svg {
      color: var(--warning-color);
   }
   }
}
}

.legal {
   display: flex;
   flex-direction: column;
   row-gap: toEm(8);
   color: var(--color);
   padding-inline-start: toEm(22);

   @media (max-width:$mobile){
      padding-inline-start: toRem(0);
      margin-block-start: toEm(16);
   }

&__title {
   margin-block-end: toEm(2);
   color: var(--light-color);
}

&__address {
   svg {
      translate: toRem(-5) toRem(4);
      color: var(--gray-color);
   }
}

&__account {
   align-self: end;
}

&__swift {
   align-self: end;
}
}

.iconify {
   font-size: toRem(22);
}

</style>