import type { StrapiImage } from "./image";

export interface SocialLink {
  id: number;
  label: string;
  href: string;
  isSocial: boolean | null;
  icon: StrapiImage[];
}

export interface Email {
  id: number;
  email: string;
  isEmail: boolean | null;
}

export interface Phone {
  id: number;
  phoneNumber: string;
  isMobile: boolean | null;
}

export interface FooterData {
  id: number;
  companyName: string;
  copyright: string;
  legalAdress: string;
  taxId: string;
  workingHours: string;
  logo: StrapiImage[];
}

export interface LegalInfo {
  id: number;
  accountNumber: string;
  bankAddress: string;
  bankName: string;
  swiftCode: string;
}

export type GlobalData = {
  id: number;
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
