import type { Schema, Struct } from '@strapi/strapi';

export interface BackgroundBackgroundImage extends Struct.ComponentSchema {
  collectionName: 'components_background_background_images';
  info: {
    displayName: 'Background Image';
  };
  attributes: {
    baseBgImageWebp: Schema.Attribute.Media<'images'>;
    retinaBgImageAvif: Schema.Attribute.Media<'images'>;
  };
}

export interface BackgroundBackgroundOption extends Struct.ComponentSchema {
  collectionName: 'components_background_background_options';
  info: {
    description: '\u041E\u0434\u0438\u043D \u0432\u0430\u0440\u0438\u0430\u043D\u0442 \u0444\u043E\u043D\u0430';
    displayName: 'Background Option';
  };
  attributes: {
    imageAvif: Schema.Attribute.Media<'images'> & Schema.Attribute.Required;
    imageWebp: Schema.Attribute.Media<'images'> & Schema.Attribute.Required;
    isDefault: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    thumbnail: Schema.Attribute.Media<'images'>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface BackgroundBackgroundOptions extends Struct.ComponentSchema {
  collectionName: 'components_background_background_options_wrapper';
  info: {
    description: '\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0444\u043E\u043D\u043E\u0432\u044B\u0445 \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u0439';
    displayName: 'Background Options';
  };
  attributes: {
    enableBackground: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<true>;
    options: Schema.Attribute.Component<'background.background-option', true>;
  };
}

export interface ContactsEmail extends Struct.ComponentSchema {
  collectionName: 'components_contacts_emails';
  info: {
    description: '';
    displayName: 'Email';
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

export interface LayoutBreadcrumbs extends Struct.ComponentSchema {
  collectionName: 'components_layout_breadcrumbs';
  info: {
    displayName: 'breadcrumbs';
    icon: 'brush';
  };
  attributes: {
    background: Schema.Attribute.Component<
      'background.background-image',
      false
    >;
    title: Schema.Attribute.String;
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
    logo: Schema.Attribute.Media<'images'>;
    taxId: Schema.Attribute.String;
    workingHours: Schema.Attribute.String;
  };
}

export interface LayoutHeader extends Struct.ComponentSchema {
  collectionName: 'components_layout_headers';
  info: {
    description: '\u0414\u0430\u043D\u043D\u044B\u0435 \u0448\u0430\u043F\u043A\u0438 \u0441\u0430\u0439\u0442\u0430';
    displayName: 'Header';
  };
  attributes: {
    bannerText: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    navigation: Schema.Attribute.DynamicZone<['layout.link']>;
  };
}

export interface LayoutLink extends Struct.ComponentSchema {
  collectionName: 'components_layout_links';
  info: {
    description: '\u041F\u0443\u043D\u043A\u0442 \u043D\u0430\u0432\u0438\u0433\u0430\u0446\u0438\u0438';
    displayName: 'Link';
  };
  attributes: {
    label: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    url: Schema.Attribute.String & Schema.Attribute.Required;
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
    displayName: 'Featured Products';
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
    displayName: 'Hero Grids';
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
    displayName: 'Hero Slider';
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
      'background.background-option': BackgroundBackgroundOption;
      'background.background-options': BackgroundBackgroundOptions;
      'contacts.email': ContactsEmail;
      'contacts.phone': ContactsPhone;
      'contacts.social': ContactsSocial;
      'layout.breadcrumbs': LayoutBreadcrumbs;
      'layout.footer': LayoutFooter;
      'layout.header': LayoutHeader;
      'layout.link': LayoutLink;
      'legal.bank-details': LegalBankDetails;
      'sections.featured-products': SectionsFeaturedProducts;
      'sections.hero-grids': SectionsHeroGrids;
      'seo.seo': SeoSeo;
      'sliders.hero-slider': SlidersHeroSlider;
    }
  }
}
