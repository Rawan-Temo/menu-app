export const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? ''

/** Local uploads are stored as "/uploads/x.jpg"; prefix the API host when the client is hosted elsewhere. */
export const assetUrl = (u?: string | null) => (!u ? '' : u.startsWith('/') ? API_BASE + u : u)

export function fmtPrice(n: number, currency: string) {
  const s = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(n)
  return ['$', '€', '£'].includes(currency) ? currency + s : `${s} ${currency}`
}

export const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40)
