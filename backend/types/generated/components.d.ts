import type { Schema, Struct } from '@strapi/strapi';

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

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'contacts.email': ContactsEmail;
      'contacts.phone': ContactsPhone;
      'contacts.social': ContactsSocial;
      'layout.footer': LayoutFooter;
      'legal.bank-details': LegalBankDetails;
      'seo.seo': SeoSeo;
    }
  }
}
