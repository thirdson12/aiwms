export type Locale = 'tr' | 'en';

export const DEFAULT_LOCALE: Locale = 'tr';
export const LOCALE_COOKIE = 'aiwms_locale';

export type Messages = {
  common: Record<string, string>;
  nav: Record<string, string>;
  roles: Record<string, string>;
  jobStatus: Record<string, string>;
  stockType: Record<string, string>;
  debtStatus: Record<string, string>;
  debts: Record<string, string>;
  login: Record<string, string>;
  dashboard: Record<string, string>;
  jobs: Record<string, string>;
  inventory: Record<string, string>;
  customers: Record<string, string>;
  accounting: Record<string, string>;
  reports: Record<string, string>;
  whatsapp: Record<string, string>;
  users: Record<string, string>;
  settings: Record<string, string>;
  errors: Record<string, string>;
};
