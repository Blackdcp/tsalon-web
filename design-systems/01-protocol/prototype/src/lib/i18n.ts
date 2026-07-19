export type SiteLocale = 'zh' | 'en';

export const localeFromPath = (pathname: string): SiteLocale =>
  pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'zh';

export const withoutLocale = (pathname: string) => {
  if (pathname === '/en' || pathname === '/en/') return '/';
  return pathname.startsWith('/en/') ? pathname.slice(3) : pathname;
};

export const localizedPath = (pathname: string, locale: SiteLocale) => {
  const base = withoutLocale(pathname);
  return locale === 'en' ? (base === '/' ? '/en/' : `/en${base}`) : base;
};

export const localeName: Record<SiteLocale, string> = {
  zh: '中文',
  en: 'English',
};
