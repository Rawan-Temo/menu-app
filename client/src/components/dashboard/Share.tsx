import { useRef, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { Check, Copy, Download, Printer } from 'lucide-react'
import type { Menu } from '../../lib/types'
import { Button } from '../ui'

export function Share({ menu }: { menu: Menu }) {
  const url = `${location.origin}/r/${menu.slug}`
  const box = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)

  const download = () => {
    const canvas = box.current?.querySelector('canvas')
    if (!canvas) return
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = `${menu.slug}-menu-qr.png`
    a.click()
  }

  return (
    <div className="grid items-start gap-8 md:grid-cols-2">
      <div className="space-y-4">
        <h2 className="font-display text-2xl font-semibold">Share your menu</h2>
        <p className="text-muted">Print the QR code and put it on every table, the door, or your Instagram bio.</p>
        <div className="flex items-center gap-2 rounded-2xl bg-white p-2 ps-4 shadow-card">
          <span className="min-w-0 flex-1 truncate text-sm">{url}</span>
          <Button variant="soft" onClick={async () => { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800) }}>
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}{copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={download}><Download className="size-4" />Download PNG</Button>
          <Button variant="soft" onClick={() => window.print()}><Printer className="size-4" />Print table card</Button>
        </div>
      </div>

      <div className="print-area grid place-items-center rounded-3xl bg-white p-8 text-center shadow-card">
        <div>
          <p className="font-display text-2xl font-semibold">{menu.name}</p>
          <p className="mb-5 text-sm text-muted">Scan to see our menu</p>
          <div ref={box} className="inline-block rounded-3xl border-4 p-4" style={{ borderColor: menu.accent }}>
            <QRCodeCanvas value={url} size={220} level="H" marginSize={1} fgColor="#1b1a17" />
          </div>
        </div>
      </div>
    </div>
  )
}
