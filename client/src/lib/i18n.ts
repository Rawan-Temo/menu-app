import type { Lang } from './types'

export const LANGS: Record<Lang, { label: string; name: string; dir: 'ltr' | 'rtl' }> = {
  en: { label: 'EN', name: 'English', dir: 'ltr' },
  ar: { label: 'عربي', name: 'العربية', dir: 'rtl' },
  ku: { label: 'کوردی', name: 'کوردی', dir: 'rtl' },
  tr: { label: 'TR', name: 'Türkçe', dir: 'ltr' },
}

const dict = {
  en: { search: 'Search the menu', soldOut: 'Sold out', popular: 'Popular', empty: 'Nothing matches your search', call: 'Call', vegetarian: 'Vegetarian', vegan: 'Vegan', spicy: 'Spicy', glutenFree: 'Gluten-free', new: 'New' },
  ar: { search: 'ابحث في القائمة', soldOut: 'نفدت الكمية', popular: 'الأكثر طلبًا', empty: 'لا توجد نتائج مطابقة', call: 'اتصال', vegetarian: 'نباتي', vegan: 'نباتي صرف', spicy: 'حار', glutenFree: 'بدون غلوتين', new: 'جديد' },
  ku: { search: 'گەڕان لە مینیو', soldOut: 'تەواو بووە', popular: 'باوترین', empty: 'هیچ شتێک نەدۆزرایەوە', call: 'پەیوەندی', vegetarian: 'ڕووەکی', vegan: 'ڤیگان', spicy: 'تیژ', glutenFree: 'بێ گلوتێن', new: 'نوێ' },
  tr: { search: 'Menüde ara', soldOut: 'Tükendi', popular: 'Popüler', empty: 'Sonuç bulunamadı', call: 'Ara', vegetarian: 'Vejetaryen', vegan: 'Vegan', spicy: 'Acılı', glutenFree: 'Glütensiz', new: 'Yeni' },
} satisfies Record<Lang, Record<string, string>>

export type Key = keyof (typeof dict)['en']
export const tr = (lang: Lang, key: Key): string => dict[lang][key]
