import { ko } from './ko';
import { en } from './en';

export type Language = 'ko' | 'en';
export type TextKey = keyof typeof ko;

const translations = {
  ko,
  en,
} as const;

export type TranslationType = typeof ko | typeof en;

export function getText(lang: Language = 'ko'): TranslationType {
  return translations[lang];
}

// 중첩된 객체에서 값을 가져오는 유틸리티 함수
export function getNestedValue(obj: any, path: string) {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
} 