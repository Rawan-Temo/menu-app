import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { repo } from '../data'
import { slugify } from '../lib/format'
import { Button, Field, inputCls } from '../components/ui'

export default function Login() {
  const nav = useNavigate()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [f, setF] = useState({ email: '', password: '', restaurantName: '', slug: '' })
  const [slugTouched, setSlugTouched] = useState(false)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => { repo.getSession().then((s) => s && nav('/dashboard', { replace: true })) }, [nav])

  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }))

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setErr('')
    try {
      if (mode === 'login') await repo.login(f.email, f.password)
      else await repo.register(f)
      nav('/dashboard')
    } catch (e) { setErr((e as Error).message) } finally { setBusy(false) }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden p-12 text-white lg:flex lg:flex-col lg:justify-between"
        style={{ background: 'radial-gradient(circle at 20% 15%, rgb(255 255 255 / .25), transparent 45%), linear-gradient(135deg, var(--accent), color-mix(in oklab, var(--accent) 45%, black))' }}>
        <Link to="/" className="font-display text-2xl font-semibold">Menu.</Link>
        <div>
          <p className="font-display text-5xl font-semibold leading-tight">Your menu,<br />always fresh.</p>
          <p className="mt-4 max-w-sm text-white/80">Edit dishes, prices and availability from any device. Guests see changes instantly.</p>
        </div>
        <p className="text-sm text-white/60">Demo: demo@menu.app / demo12345</p>
      </aside>
      <main className="grid place-items-center px-6 py-12">
        <form onSubmit={submit} className="w-full max-w-sm space-y-5">
          <div>
            <h1 className="font-display text-3xl font-semibold">{mode === 'login' ? 'Welcome back' : 'Create your menu'}</h1>
            <p className="mt-1 text-sm text-muted">{mode === 'login' ? 'Sign in to manage your menu.' : 'Takes about two minutes.'}</p>
          </div>
          {mode === 'register' && (
            <>
              <Field label="Restaurant name">
                <input className={inputCls} required value={f.restaurantName} onChange={(e) => { set('restaurantName', e.target.value); if (!slugTouched) set('slug', slugify(e.target.value)) }} />
              </Field>
              <Field label="Menu link" hint={`${location.host}/r/${f.slug || 'your-name'}`}>
                <input className={inputCls} required pattern="[a-z0-9\-]{3,40}" value={f.slug} onChange={(e) => { setSlugTouched(true); set('slug', e.target.value.toLowerCase()) }} />
              </Field>
            </>
          )}
          <Field label="Email"><input className={inputCls} type="email" required autoComplete="email" value={f.email} onChange={(e) => set('email', e.target.value)} /></Field>
          <Field label="Password"><input className={inputCls} type="password" required minLength={8} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={f.password} onChange={(e) => set('password', e.target.value)} /></Field>
          {err && <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{err}</p>}
          <Button type="submit" loading={busy} className="w-full py-3">{mode === 'login' ? 'Sign in' : 'Create account'}</Button>
          <p className="text-center text-sm text-muted">
            {mode === 'login' ? 'New here? ' : 'Already have an account? '}
            <button type="button" className="font-semibold text-accent" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErr('') }}>
              {mode === 'login' ? 'Create a menu' : 'Sign in'}
            </button>
          </p>
        </form>
      </main>
    </div>
  )
}
