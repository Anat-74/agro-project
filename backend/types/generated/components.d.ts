import type { Schema, Struct } from '@strapi/strapi';

export interface BackgroundBackgroundImage extends Struct.ComponentSchema {
  collectionName: 'components_background_background_images';
  info: {
    displayName: 'Background-image';
  };
  attributes: {
    baseBgImageWebp: Schema.Attribute.Media<'images'>;
    retinaBgImageAvif: Schema.Attribute.Media<'images'>;
  };
}

export interface ContactsEmail extends Struct.ComponentSchema {
  collectionName: 'components_contacts_emails';
  info: {
    description: '';
    displayName: 'email';
  };
  attributes: {
    email: Schema.Attribute.Email & Schema.Attribute.Required;
    isEmail: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
  };
}

export interface ContactsPhone extends Struct.ComponentSchema {
  collectionName: 'components_contacts_phones';
  info: {
    description: '';
    displayName: 'Phone';
  };
  attributes: {
    isMobile: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    phoneNumber: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ContactsSocial extends Struct.ComponentSchema {
  collectionName: 'components_contacts_socials';
  info: {
    description: '';
    displayName: 'Social';
  };
  attributes: {
    href: Schema.Attribute.String;
    icon: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios',
      true
    >;
    isSocial: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    label: Schema.Attribute.String;
  };
}

export interface LayoutFooter extends Struct.ComponentSchema {
  collectionName: 'components_layout_footers';
  info: {
    description: '';
    displayName: 'Footer';
  };
  attributes: {
    companyName: Schema.Attribute.String;
    copyright: Schema.Attribute.String;
    legalAdress: Schema.Attribute.String;
    logo: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios',
      true
    >;
    taxId: Schema.Attribute.String;
    workingHours: Schema.Attribute.String;
  };
}

export interface LegalBankDetails extends Struct.ComponentSchema {
  collectionName: 'components_legal_bank_details';
  info: {
    description: '';
    displayName: 'BankDetails';
  };
  attributes: {
    accountNumber: Schema.Attribute.String;
    bankAddress: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    bankName: Schema.Attribute.String;
    swiftCode: Schema.Attribute.String;
  };
}

export interface SectionsFeaturedProducts extends Struct.ComponentSchema {
  collectionName: 'components_sections_featured_products';
  info: {
    displayName: 'Featured-products';
  };
  attributes: {
    backgroundImage: Schema.Attribute.Component<
      'background.background-image',
      false
    >;
    heading: Schema.Attribute.String;
    image: Schema.Attribute.Media<'images'>;
    link: Schema.Attribute.String;
    percentDiscount: Schema.Attribute.String;
    products: Schema.Attribute.Relation<'oneToMany', 'api::product.product'>;
    saleText: Schema.Attribute.String;
  };
}

export interface SectionsHeroGrids extends Struct.ComponentSchema {
  collectionName: 'components_sections_hero_grids';
  info: {
    displayName: 'Hero-grids';
  };
  attributes: {
    heading: Schema.Attribute.String;
    icons: Schema.Attribute.Media<'images'>;
    isVisible: Schema.Attribute.Boolean;
    text: Schema.Attribute.String;
  };
}

export interface SeoSeo extends Struct.ComponentSchema {
  collectionName: 'components_seo_seos';
  info: {
    description: '';
    displayName: 'SEO';
  };
  attributes: {
    metaDescription: Schema.Attribute.Text;
    metaTitle: Schema.Attribute.String;
    structuredData: Schema.Attribute.JSON;
  };
}

export interface SlidersHeroSlider extends Struct.ComponentSchema {
  collectionName: 'components_sliders_hero_sliders';
  info: {
    displayName: 'Hero-slider';
  };
  attributes: {
    backgroundImage: Schema.Attribute.Component<
      'background.background-image',
      false
    >;
    heading: Schema.Attribute.String;
    image: Schema.Attribute.Media<'images'>;
    isDiscount: Schema.Attribute.Boolean;
    isTextBottom: Schema.Attribute.Boolean;
    percentDiscount: Schema.Attribute.String;
    saleText: Schema.Attribute.String;
    textBottom: Schema.Attribute.String;
    textLink: Schema.Attribute.String;
    textTop: Schema.Attribute.String;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'background.background-image': BackgroundBackgroundImage;
      'contacts.email': ContactsEmail;
      'contacts.phone': ContactsPhone;
      'contacts.social': ContactsSocial;
      'layout.footer': LayoutFooter;
      'legal.bank-details': LegalBankDetails;
      'sections.featured-products': SectionsFeaturedProducts;
      'sections.hero-grids': SectionsHeroGrids;
      'seo.seo': SeoSeo;
      'sliders.hero-slider': SlidersHeroSlider;
    }
  }
}
