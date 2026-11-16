import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Languages, QrCode, RefreshCw, Sparkles } from 'lucide-react'
import { repo } from '../data'

const features = [
  { icon: QrCode, title: 'Scan & browse', text: 'One QR code per table. No app to install, opens instantly on any phone.' },
  { icon: RefreshCw, title: 'Update in seconds', text: 'Change a price or mark a dish sold out – guests see it live. No reprinting.' },
  { icon: Languages, title: 'Two languages', text: 'Arabic, Kurdish, Turkish or English. Right-to-left done properly.' },
]

export default function Landing() {
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    repo.getSession()
      .then((session) => setLoggedIn(Boolean(session)))
      .catch(() => setLoggedIn(false))
  }, [])

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(232,89,12,0.12),_transparent_38%),_linear-gradient(180deg,_#f9f3ee_0%,_#fff_100%)]">
      <div className="mx-auto max-w-6xl px-5 py-6 sm:px-6">
        <nav className="flex items-center justify-between rounded-full border border-black/5 bg-white/75 px-3 py-2 shadow-card backdrop-blur-sm">
          <span className="font-display text-xl font-semibold tracking-tight">Menu<span className="text-accent">.</span></span>
          <div className="flex items-center gap-2">
            {loggedIn ? (
              <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition hover:brightness-110">
                Open dashboard
              </Link>
            ) : (
              <Link to="/login" className="rounded-full px-4 py-2 text-sm font-semibold text-ink transition hover:bg-black/5">Owner login</Link>
            )}
          </div>
        </nav>

        <section className="grid items-center gap-8 py-12 sm:py-18 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <div className="max-w-xl">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1.5 text-sm font-semibold text-accent">
              <Sparkles className="size-3.5" /> Digital menus for restaurants
            </span>
            <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-6xl">
              Retire the paper menu.
              <span className="mt-2 block text-accent">Keep the charm.</span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-muted sm:text-lg">
              A beautiful, always-up-to-date menu your guests open with one scan — and you update from your phone in seconds.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/r/demo" className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 font-semibold text-white shadow-lg shadow-accent/25 transition hover:brightness-110">
                See live demo <ArrowRight className="size-4" />
              </Link>
              {loggedIn ? (
                <Link to="/dashboard" className="rounded-full border border-black/10 bg-white px-5 py-3 font-semibold text-ink shadow-card transition hover:border-accent/30 hover:text-accent">
                  Go to dashboard
                </Link>
              ) : (
                <Link to="/login" className="rounded-full border border-black/10 bg-white px-5 py-3 font-semibold text-ink shadow-card transition hover:border-accent/30 hover:text-accent">
                  Create your menu
                </Link>
              )}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-6 top-10 h-32 w-32 rounded-full bg-accent/15 blur-3xl" />
            <div className="absolute -right-4 bottom-10 h-28 w-28 rounded-full bg-orange-200/60 blur-3xl" />
            <div className="relative overflow-hidden rounded-[30px] border border-black/5 bg-white p-4 shadow-[0_18px_50px_-24px_rgba(31,24,17,0.35)]">
              <div className="rounded-[24px] border border-line bg-[#fbf7f2] p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted">Saffron house</p>
                    <h2 className="mt-1 font-display text-2xl font-semibold">Dinner menu</h2>
                  </div>
                  <div className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">Live</div>
                </div>

                <div className="space-y-3">
                  {[
                    ['Mango salad', '12.00', 'Fresh, bright, crisp'],
                    ['Grilled lamb', '26.00', 'Mint, chili, herbs'],
                    ['Cinnamon tart', '9.50', 'Warm and buttery'],
                  ].map(([name, price, detail]) => (
                    <div key={name} className="flex items-center justify-between gap-4 rounded-2xl bg-white p-3 shadow-sm">
                      <div>
                        <p className="font-semibold text-ink">{name}</p>
                        <p className="text-xs text-muted">{detail}</p>
                      </div>
                      <span className="font-semibold text-accent">${price}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex items-center justify-between rounded-2xl bg-[#f2e7db] p-3 text-sm">
                  <span className="font-medium text-ink">Quick edit</span>
                  <span className="rounded-full bg-white px-2 py-1 font-semibold text-accent">2 min</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 pb-16 sm:grid-cols-3">
          {features.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-3xl border border-black/5 bg-white p-6 shadow-card">
              <span className="mb-4 grid size-11 place-items-center rounded-2xl bg-accent/10 text-accent"><Icon className="size-5" /></span>
              <h3 className="font-display text-lg font-semibold">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">{text}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  )
}
