import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Locale } from '@/lib/i18n';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value: string | null | undefined, locale: Locale = 'tr') {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US');
}

export function formatDateTime(value: string | null | undefined, locale: Locale = 'tr') {
  if (!value) return '—';
  return new Date(value).toLocaleString(locale === 'tr' ? 'tr-TR' : 'en-US');
}
