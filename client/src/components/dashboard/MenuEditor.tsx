import { useEffect, useState, type FormEvent } from 'react'
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react'
import { repo } from '../../data'
import type { ItemInput } from '../../data/repository'
import { TAGS, type Category, type Item, type Menu, type Tag } from '../../lib/types'
import { tr } from '../../lib/i18n'
import { fmtPrice } from '../../lib/format'
import type { Notify } from '../../pages/Dashboard'
import { Button, Field, ImagePicker, inputCls, Modal, Toggle } from '../ui'
import { TagBadge, Thumb } from '../Thumb'

type Props = { menu: Menu; reload: () => Promise<void>; notify: Notify }

export function MenuEditor({ menu, reload, notify }: Props) {
  const [sel, setSel] = useState(menu.categories[0]?.id ?? '')
  const [catModal, setCatModal] = useState<{ cat?: Category } | null>(null)
  const [itemModal, setItemModal] = useState<{ item?: Item } | null>(null)

  useEffect(() => {
    if (!menu.categories.some((c) => c.id === sel)) setSel(menu.categories[0]?.id ?? '')
  }, [menu, sel])

  const cat = menu.categories.find((c) => c.id === sel)

  const run = async (fn: () => Promise<unknown>, ok?: string) => {
    try { await fn(); await reload(); if (ok) notify(ok) } catch (e) { notify((e as Error).message, 'error') }
  }

  /** Re-number the whole list so ordering never depends on previous gaps. */
  const move = <T extends { id: string }>(list: T[], id: string, dir: -1 | 1, save: (id: string, sort: number) => Promise<void>) => {
    const i = list.findIndex((x) => x.id === id), j = i + dir
    if (j < 0 || j >= list.length) return
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]]
    return run(() => Promise.all(next.map((x, idx) => save(x.id, idx))))
  }

  return (
    <div className="grid gap-6 md:grid-cols-[260px_1fr]">
      {/* Categories */}
      <aside className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Categories</h2>
          <Button variant="soft" className="!px-3 !py-1.5" onClick={() => setCatModal({})}><Plus className="size-4" />Add</Button>
        </div>
        <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 md:mx-0 md:flex-col md:overflow-visible md:px-0">
          {menu.categories.map((c) => (
            <button key={c.id} onClick={() => setSel(c.id)}
              className={`flex shrink-0 items-center justify-between gap-3 rounded-2xl px-4 py-3 text-start text-sm font-semibold transition ${sel === c.id ? 'bg-accent text-white shadow-md' : 'bg-white shadow-card hover:-translate-y-px'}`}>
              <span className="truncate">{c.name}</span>
              <span className={`text-xs ${sel === c.id ? 'text-white/75' : 'text-muted'}`}>{c.items.length}</span>
            </button>
          ))}
        </div>
        {cat && (
          <div className="flex gap-1 pt-1">
            <Button variant="ghost" className="!p-2" aria-label="Move up" onClick={() => move(menu.categories, cat.id, -1, (id, sort) => repo.updateCategory(id, { sort }))}><ArrowUp className="size-4" /></Button>
            <Button variant="ghost" className="!p-2" aria-label="Move down" onClick={() => move(menu.categories, cat.id, 1, (id, sort) => repo.updateCategory(id, { sort }))}><ArrowDown className="size-4" /></Button>
            <Button variant="ghost" className="!p-2" aria-label="Rename" onClick={() => setCatModal({ cat })}><Pencil className="size-4" /></Button>
            <Button variant="danger" className="!p-2" aria-label="Delete category"
              onClick={() => confirm(`Delete "${cat.name}" and its ${cat.items.length} item(s)?`) && run(() => repo.deleteCategory(cat.id), 'Category deleted')}><Trash2 className="size-4" /></Button>
          </div>
        )}
      </aside>

      {/* Items */}
      <section>
        {!cat ? (
          <div className="rounded-3xl border-2 border-dashed border-line p-12 text-center text-muted">
            <p className="font-display text-xl text-ink">Start with a category</p>
            <p className="mt-1 text-sm">e.g. Starters, Mains, Drinks</p>
            <Button className="mt-5" onClick={() => setCatModal({})}><Plus className="size-4" />Add category</Button>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-2xl font-semibold">{cat.name}</h2>
              <Button onClick={() => setItemModal({})}><Plus className="size-4" />Add item</Button>
            </div>
            <div className="space-y-3">
              {cat.items.length === 0 && <p className="rounded-3xl bg-white p-8 text-center text-sm text-muted shadow-card">No items yet – add your first dish.</p>}
              {cat.items.map((i) => (
                <div key={i.id} className={`flex items-center gap-3 rounded-3xl bg-white p-3 shadow-card ${i.available ? '' : 'opacity-70'}`}>
                  <Thumb src={i.imageUrl} label={i.name} className="size-16 shrink-0 rounded-2xl" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{i.name}</p>
                    <p className="flex items-center gap-2 text-sm text-muted">
                      <span className="font-semibold text-accent">{fmtPrice(i.price, menu.currency)}</span>
                      {i.tags.map((t) => <TagBadge key={t} tag={t} lang="en" />)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <span className="me-1 hidden text-xs text-muted sm:inline">{i.available ? 'Available' : 'Sold out'}</span>
                    <Toggle checked={i.available} label="Available" onChange={(v) => run(() => repo.updateItem(i.id, { available: v }))} />
                    <Button variant="ghost" className="!p-2" aria-label="Move up" onClick={() => move(cat.items, i.id, -1, (id, sort) => repo.updateItem(id, { sort }))}><ArrowUp className="size-4" /></Button>
                    <Button variant="ghost" className="!p-2" aria-label="Move down" onClick={() => move(cat.items, i.id, 1, (id, sort) => repo.updateItem(id, { sort }))}><ArrowDown className="size-4" /></Button>
                    <Button variant="ghost" className="!p-2" aria-label="Edit" onClick={() => setItemModal({ item: i })}><Pencil className="size-4" /></Button>
                    <Button variant="danger" className="!p-2" aria-label="Delete" onClick={() => confirm(`Delete "${i.name}"?`) && run(() => repo.deleteItem(i.id), 'Item deleted')}><Trash2 className="size-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {catModal && (
        <CategoryModal cat={catModal.cat} onClose={() => setCatModal(null)}
          onSave={(v) => run(async () => { catModal.cat ? await repo.updateCategory(catModal.cat.id, v) : await repo.createCategory(v); setCatModal(null) }, 'Saved')} />
      )}
      {itemModal && cat && (
        <ItemModal item={itemModal.item} categoryId={cat.id} menu={menu} onClose={() => setItemModal(null)}
          onSave={(v) => run(async () => { itemModal.item ? await repo.updateItem(itemModal.item.id, v) : await repo.createItem(v); setItemModal(null) }, 'Saved')} />
      )}
    </div>
  )
}

function CategoryModal({ cat, onClose, onSave }: { cat?: Category; onClose: () => void; onSave: (v: { name: string; nameAlt: string | null }) => void }) {
  const [name, setName] = useState(cat?.name ?? '')
  const [nameAlt, setNameAlt] = useState(cat?.nameAlt ?? '')
  return (
    <Modal title={cat ? 'Edit category' : 'New category'} onClose={onClose}>
      <form className="space-y-4" onSubmit={(e: FormEvent) => { e.preventDefault(); onSave({ name: name.trim(), nameAlt: nameAlt.trim() || null }) }}>
        <Field label="Name"><input autoFocus required className={inputCls} value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="Name in second language" hint="Optional"><input dir="auto" className={inputCls} value={nameAlt} onChange={(e) => setNameAlt(e.target.value)} /></Field>
        <Button type="submit" className="w-full">Save</Button>
      </form>
    </Modal>
  )
}

function ItemModal({ item, categoryId, menu, onClose, onSave }: { item?: Item; categoryId: string; menu: Menu; onClose: () => void; onSave: (v: ItemInput) => void }) {
  const [f, setF] = useState({
    name: item?.name ?? '', nameAlt: item?.nameAlt ?? '',
    description: item?.description ?? '', descriptionAlt: item?.descriptionAlt ?? '',
    price: item ? String(item.price) : '', imageUrl: item?.imageUrl ?? null,
    tags: item?.tags ?? ([] as Tag[]), available: item?.available ?? true, featured: item?.featured ?? false,
  })
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }))
  const toggleTag = (t: Tag) => set('tags', f.tags.includes(t) ? f.tags.filter((x) => x !== t) : [...f.tags, t])

  return (
    <Modal title={item ? 'Edit item' : 'New item'} onClose={onClose}>
      <form className="space-y-4" onSubmit={(e: FormEvent) => {
        e.preventDefault()
        onSave({
          categoryId: item?.categoryId ?? categoryId,
          name: f.name.trim(), nameAlt: f.nameAlt.trim() || null,
          description: f.description.trim() || null, descriptionAlt: f.descriptionAlt.trim() || null,
          price: Number(f.price), imageUrl: f.imageUrl, tags: f.tags, available: f.available, featured: f.featured,
        })
      }}>
        <ImagePicker label="Photo" value={f.imageUrl} onChange={(v) => set('imageUrl', v)} />
        <Field label="Name"><input autoFocus required className={inputCls} value={f.name} onChange={(e) => set('name', e.target.value)} /></Field>
        <Field label="Name in second language"><input dir="auto" className={inputCls} value={f.nameAlt} onChange={(e) => set('nameAlt', e.target.value)} /></Field>
        <Field label="Description"><textarea rows={2} className={inputCls} value={f.description} onChange={(e) => set('description', e.target.value)} /></Field>
        <Field label="Description in second language"><textarea dir="auto" rows={2} className={inputCls} value={f.descriptionAlt} onChange={(e) => set('descriptionAlt', e.target.value)} /></Field>
        <Field label={`Price (${menu.currency})`}><input required type="number" min={0} step="any" inputMode="decimal" className={inputCls} value={f.price} onChange={(e) => set('price', e.target.value)} /></Field>
        <div>
          <span className="mb-1.5 block text-sm font-medium">Labels</span>
          <div className="flex flex-wrap gap-2">
            {TAGS.map((t) => (
              <button type="button" key={t} onClick={() => toggleTag(t)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${f.tags.includes(t) ? 'bg-accent text-white' : 'bg-white shadow-card'}`}>{tr('en', t)}</button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between rounded-2xl bg-white p-3.5 shadow-card"><span className="text-sm font-medium">Mark as popular</span><Toggle checked={f.featured} label="Popular" onChange={(v) => set('featured', v)} /></div>
        <div className="flex items-center justify-between rounded-2xl bg-white p-3.5 shadow-card"><span className="text-sm font-medium">Available</span><Toggle checked={f.available} label="Available" onChange={(v) => set('available', v)} /></div>
        <Button type="submit" className="w-full">Save item</Button>
      </form>
    </Modal>
  )
}
