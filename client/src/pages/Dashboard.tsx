import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ExternalLink, LogOut, Palette, QrCode, UtensilsCrossed } from 'lucide-react'
import { repo } from '../data'
import type { Menu } from '../lib/types'
import { MenuEditor } from '../components/dashboard/MenuEditor'
import { Appearance } from '../components/dashboard/Appearance'
import { Share } from '../components/dashboard/Share'

export type Notify = (msg: string, kind?: 'ok' | 'error') => void
const TABS = [
  { id: 'menu', label: 'Menu', icon: UtensilsCrossed },
  { id: 'look', label: 'Appearance', icon: Palette },
  { id: 'share', label: 'QR & link', icon: QrCode },
] as const

export default function Dashboard() {
  const nav = useNavigate()
  const [menu, setMenu] = useState<Menu | null>(null)
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('menu')
  const [toast, setToast] = useState<{ msg: string; kind: 'ok' | 'error' } | null>(null)

  const notify: Notify = useCallback((msg, kind = 'ok') => { setToast({ msg, kind }); setTimeout(() => setToast(null), 2600) }, [])
  const reload = useCallback(async () => setMenu(await repo.getMyMenu()), [])

  useEffect(() => {
    repo.getSession()
      .then(async (s) => { if (!s) return nav('/login', { replace: true }); await reload() })
      .catch(() => nav('/login', { replace: true }))
  }, [nav, reload])

  if (!menu) return <div className="grid min-h-screen place-items-center"><div className="size-8 animate-spin rounded-full border-4 border-line border-t-accent" /></div>

  return (
    <div style={{ '--accent': menu.accent } as CSSProperties} className="min-h-screen pb-20">
      <header className="sticky top-0 z-30 border-b border-line bg-cream/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-3">
          <Link to="/" className="min-w-0 truncate font-display text-lg font-semibold">{menu.name}</Link>
          <div className="flex items-center gap-1">
            <a href={`/r/${menu.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-accent hover:bg-accent/10">
              View menu <ExternalLink className="size-3.5" />
            </a>
            <button onClick={async () => { await repo.logout(); nav('/login') }} className="rounded-xl p-2 text-muted hover:bg-black/5" aria-label="Sign out"><LogOut className="size-4" /></button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 pt-6">
        <div className="mb-6 inline-flex rounded-2xl bg-white p-1 shadow-card">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${tab === id ? 'bg-accent text-white shadow' : 'text-ink/60 hover:text-ink'}`}>
              <Icon className="size-4" /><span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
        {tab === 'menu' && <MenuEditor menu={menu} reload={reload} notify={notify} />}
        {tab === 'look' && <Appearance menu={menu} reload={reload} notify={notify} />}
        {tab === 'share' && <Share menu={menu} />}
      </div>

      {toast && (
        <div className={`fade-in fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full px-5 py-3 text-sm font-semibold text-white shadow-2xl ${toast.kind === 'ok' ? 'bg-ink' : 'bg-red-600'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
