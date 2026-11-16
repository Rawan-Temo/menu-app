export const TAGS = ['vegetarian', 'vegan', 'spicy', 'glutenFree', 'new'] as const
export type Tag = (typeof TAGS)[number]

export type Lang = 'en' | 'ar' | 'ku' | 'tr'

export interface Item {
  id: string
  categoryId: string
  name: string
  nameAlt: string | null
  description: string | null
  descriptionAlt: string | null
  price: number
  imageUrl: string | null
  tags: Tag[]
  available: boolean
  featured: boolean
  sort: number
}

export interface Category {
  id: string
  name: string
  nameAlt: string | null
  sort: number
  items: Item[]
}

export interface Restaurant {
  id: string
  slug: string
  name: string
  nameAlt: string | null
  tagline: string | null
  taglineAlt: string | null
  logoUrl: string | null
  coverUrl: string | null
  accent: string
  currency: string
  lang: Lang
  altLang: Lang
  phone: string | null
  instagram: string | null
}

export interface Menu extends Restaurant {
  categories: Category[]
}
