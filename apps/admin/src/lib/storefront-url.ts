export const STOREFRONT_BASE_URL =
  process.env.NEXT_PUBLIC_STOREFRONT_URL ?? 'http://localhost:3000';

export function storefrontUrl(path = ''): string {
  const base = STOREFRONT_BASE_URL.replace(/\/$/, '');
  if (!path) return base;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
