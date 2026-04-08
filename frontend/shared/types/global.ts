import type { StrapiImage } from "./image";

export interface SocialLink {
  id: string; // В Strapi v5 это documentId
  label: string;
  href: string;
  isSocial: boolean | null;
  icon: StrapiImage[];
}

export interface Email {
  id: string; // В Strapi v5 это documentId
  email: string;
  isEmail: boolean | null;
}

export interface Phone {
  id: string; // В Strapi v5 это documentId
  phoneNumber: string;
  isMobile: boolean | null;
}

export interface FooterData {
  id: string; // В Strapi v5 это documentId
  companyName: string;
  copyright: string;
  legalAdress: string;
  taxId: string;
  workingHours: string;
  logo: StrapiImage[];
}

export interface LegalInfo {
  id: string; // В Strapi v5 это documentId
  accountNumber: string;
  bankAddress: string;
  bankName: string;
  swiftCode: string;
}

export type GlobalData = {
  id: string; // В Strapi v5 это documentId
  documentId: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  locale: string;
  email: Email[];
  phones: Phone[];
  socials: SocialLink[];
  footer: FooterData;
  legal: LegalInfo;
};
