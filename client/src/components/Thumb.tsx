import { useEffect, useState } from 'react'
import { assetUrl } from '../lib/format'
import { tr } from '../lib/i18n'
import type { Lang, Tag } from '../lib/types'

/** Image with a graceful, brand-coloured fallback (missing / broken / no image). */
export function Thumb({ src, label, className = '' }: { src?: string | null; label: string; className?: string }) {
  const [bad, setBad] = useState(false)
  useEffect(() => setBad(false), [src])
  if (!src || bad)
    return (
      <div className={`grid place-items-center bg-accent/10 font-display text-3xl font-semibold text-accent ${className}`}>
        {label.trim().charAt(0).toUpperCase() || '·'}
      </div>
    )
  return <img src={assetUrl(src)} alt="" loading="lazy" onError={() => setBad(true)} className={`object-cover ${className}`} />
}

const ICON: Record<Tag, string> = { vegetarian: '🥬', vegan: '🌱', spicy: '🌶️', glutenFree: 'GF', new: '✨' }

export function TagBadge({ tag, lang, long }: { tag: Tag; lang: Lang; long?: boolean }) {
  return (
    <span
      title={tr(lang, tag)}
      className="inline-flex h-6 min-w-6 items-center justify-center gap-1 rounded-full bg-accent/10 px-1.5 text-[11px] font-semibold text-accent"
    >
      {ICON[tag]}
      {long && <span className="pe-1">{tr(lang, tag)}</span>}
    </span>
  )
}
