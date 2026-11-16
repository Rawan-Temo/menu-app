import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { repo } from '../data'
import { Thumb } from './Thumb'

export const inputCls =
  'w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-[15px] outline-none transition placeholder:text-muted/60 focus:border-accent focus:ring-4 focus:ring-accent/15'

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  )
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'soft' | 'ghost' | 'danger'; loading?: boolean }
const variants = {
  primary: 'bg-accent text-white shadow-sm hover:brightness-110',
  soft: 'bg-accent/10 text-accent hover:bg-accent/15',
  ghost: 'text-ink/70 hover:bg-black/5',
  danger: 'text-red-600 hover:bg-red-50',
}
export function Button({ variant = 'primary', loading, className = '', children, disabled, ...p }: BtnProps) {
  return (
    <button
      {...p}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition active:scale-[.97] disabled:opacity-50 ${variants[variant]} ${className}`}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  )
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? 'bg-accent' : 'bg-black/15'}`}
    >
      <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${checked ? 'start-[22px]' : 'start-0.5'}`} />
    </button>
  )
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/40 backdrop-blur-[2px] fade-in sm:place-items-center" onMouseDown={onClose}>
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="sheet-in max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-cream p-5 shadow-2xl sm:rounded-3xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-xl font-semibold">{title}</h3>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-black/5" aria-label="Close"><X className="size-5" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function ImagePicker({ value, onChange, label, round }: { value: string | null; onChange: (url: string | null) => void; label: string; round?: boolean }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  async function pick(f?: File) {
    if (!f) return
    setBusy(true); setErr('')
    try { onChange(await repo.uploadImage(f)) } catch (e) { setErr((e as Error).message) } finally { setBusy(false) }
  }
  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <div className="flex items-center gap-3">
        <Thumb src={value} label="+" className={`size-20 shrink-0 ${round ? 'rounded-full' : 'rounded-2xl'}`} />
        <div className="flex flex-wrap gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-accent/10 px-3.5 py-2 text-sm font-semibold text-accent hover:bg-accent/15">
            {busy ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
            Upload
            <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => pick(e.target.files?.[0])} />
          </label>
          {value && <Button type="button" variant="ghost" onClick={() => onChange(null)}>Remove</Button>}
        </div>
      </div>
      {err && <p className="mt-1 text-xs text-red-600">{err}</p>}
    </div>
  )
}
