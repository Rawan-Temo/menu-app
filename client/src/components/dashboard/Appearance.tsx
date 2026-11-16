import { useState, type FormEvent } from 'react'
import { repo } from '../../data'
import { LANGS } from '../../lib/i18n'
import type { Lang, Menu } from '../../lib/types'
import type { Notify } from '../../pages/Dashboard'
import { Button, Field, ImagePicker, inputCls } from '../ui'

const SWATCHES = ['#C2410C', '#B45309', '#15803D', '#0F766E', '#1D4ED8', '#7C3AED', '#BE185D', '#1B1A17']
const CURRENCIES = ['IQD', 'USD', '$', 'TRY', 'EUR', '€']

export function Appearance({ menu, reload, notify }: { menu: Menu; reload: () => Promise<void>; notify: Notify }) {
  const [f, setF] = useState({
    name: menu.name, nameAlt: menu.nameAlt ?? '', tagline: menu.tagline ?? '', taglineAlt: menu.taglineAlt ?? '',
    logoUrl: menu.logoUrl, coverUrl: menu.coverUrl, accent: menu.accent, currency: menu.currency,
    lang: menu.lang, altLang: menu.altLang, phone: menu.phone ?? '', instagram: menu.instagram ?? '',
  })
  const [busy, setBusy] = useState(false)
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }))
  const langs = Object.keys(LANGS) as Lang[]

  async function save(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      await repo.updateRestaurant({
        ...f,
        nameAlt: f.nameAlt.trim() || null, tagline: f.tagline.trim() || null, taglineAlt: f.taglineAlt.trim() || null,
        phone: f.phone.trim() || null, instagram: f.instagram.trim().replace('@', '') || null,
      })
      await reload()
      notify('Saved')
    } catch (e) { notify((e as Error).message, 'error') } finally { setBusy(false) }
  }

  return (
    <form onSubmit={save} className="grid gap-8 lg:grid-cols-[1fr_300px]">
      <div className="space-y-5 rounded-3xl bg-white p-6 shadow-card">
        <div className="grid gap-5 sm:grid-cols-2">
          <ImagePicker label="Logo" round value={f.logoUrl} onChange={(v) => set('logoUrl', v)} />
          <ImagePicker label="Cover photo" value={f.coverUrl} onChange={(v) => set('coverUrl', v)} />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Restaurant name"><input required className={inputCls} value={f.name} onChange={(e) => set('name', e.target.value)} /></Field>
          <Field label="Name in second language"><input dir="auto" className={inputCls} value={f.nameAlt} onChange={(e) => set('nameAlt', e.target.value)} /></Field>
          <Field label="Tagline"><input className={inputCls} value={f.tagline} onChange={(e) => set('tagline', e.target.value)} /></Field>
          <Field label="Tagline in second language"><input dir="auto" className={inputCls} value={f.taglineAlt} onChange={(e) => set('taglineAlt', e.target.value)} /></Field>
          <Field label="Main language">
            <select className={inputCls} value={f.lang} onChange={(e) => set('lang', e.target.value as Lang)}>{langs.map((l) => <option key={l} value={l}>{LANGS[l].name}</option>)}</select>
          </Field>
          <Field label="Second language">
            <select className={inputCls} value={f.altLang} onChange={(e) => set('altLang', e.target.value as Lang)}>{langs.map((l) => <option key={l} value={l}>{LANGS[l].name}</option>)}</select>
          </Field>
          <Field label="Currency" hint="Shown next to prices">
            <input list="currencies" className={inputCls} value={f.currency} onChange={(e) => set('currency', e.target.value)} maxLength={5} required />
            <datalist id="currencies">{CURRENCIES.map((c) => <option key={c} value={c} />)}</datalist>
          </Field>
          <Field label="Phone"><input type="tel" className={inputCls} value={f.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
          <Field label="Instagram"><input className={inputCls} placeholder="username" value={f.instagram} onChange={(e) => set('instagram', e.target.value)} /></Field>
        </div>
        <div>
          <span className="mb-2 block text-sm font-medium">Brand colour</span>
          <div className="flex flex-wrap items-center gap-2.5">
            {SWATCHES.map((c) => (
              <button type="button" key={c} aria-label={c} onClick={() => set('accent', c)} style={{ background: c }}
                className={`size-9 rounded-full transition ${f.accent.toLowerCase() === c.toLowerCase() ? 'ring-4 ring-black/15 ring-offset-2' : 'hover:scale-110'}`} />
            ))}
            <input type="color" value={f.accent} onChange={(e) => set('accent', e.target.value)} className="size-9 cursor-pointer rounded-full border-0 bg-transparent p-0" aria-label="Custom colour" />
          </div>
        </div>
        <Button type="submit" loading={busy}>Save changes</Button>
      </div>

      <aside className="h-fit rounded-3xl bg-white p-5 shadow-card lg:sticky lg:top-24" style={{ '--accent': f.accent } as React.CSSProperties}>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Preview</p>
        <div className="overflow-hidden rounded-2xl border border-line bg-cream">
          <div className="h-24" style={{ background: f.coverUrl ? undefined : 'linear-gradient(135deg, var(--accent), color-mix(in oklab, var(--accent) 50%, black))' }} />
          <div className="space-y-3 p-4">
            <p className="font-display text-lg font-semibold">{f.name || 'Your restaurant'}</p>
            <div className="flex gap-2"><span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">Starters</span><span className="rounded-full bg-white px-3 py-1 text-xs font-semibold shadow-card">Mains</span></div>
            <div className="flex items-center justify-between rounded-2xl bg-white p-3 shadow-card">
              <span className="text-sm font-semibold">Signature dish</span>
              <span className="font-display font-semibold text-accent">8,500 {f.currency}</span>
            </div>
          </div>
        </div>
      </aside>
    </form>
  )
}
