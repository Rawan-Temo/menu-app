import { API_BASE } from '../lib/format'
import type { MenuRepository } from './repository'
import type { Menu } from '../lib/types'

const TOKEN = 'menu_token'

async function call<T = void>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const headers = new Headers(init.headers)
  const token = localStorage.getItem(TOKEN)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (init.json !== undefined) {
    headers.set('Content-Type', 'application/json')
    init.body = JSON.stringify(init.json)
  }
  const res = await fetch(API_BASE + '/api' + path, { ...init, headers })
  if (res.status === 204) return undefined as T
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw Object.assign(new Error(data.error ?? res.statusText), { status: res.status })
  return data as T
}

const saveToken = async (p: Promise<{ token: string }>) => localStorage.setItem(TOKEN, (await p).token)

export const httpRepository: MenuRepository = {
  async getPublicMenu(slug) {
    try { return await call<Menu>(`/public/${encodeURIComponent(slug)}`) }
    catch (e) { if ((e as { status?: number }).status === 404) return null; throw e }
  },

  async getSession() {
    if (!localStorage.getItem(TOKEN)) return null
    try { return await call<{ email: string }>('/me') }
    catch { localStorage.removeItem(TOKEN); return null }
  },
  login: (email, password) => saveToken(call('/auth/login', { method: 'POST', json: { email, password } })),
  register: (input) => saveToken(call('/auth/register', { method: 'POST', json: input })),
  async logout() { localStorage.removeItem(TOKEN) },

  getMyMenu: () => call<Menu>('/my/menu'),
  updateRestaurant: (patch) => call('/my/restaurant', { method: 'PATCH', json: patch }),
  createCategory: (input) => call('/my/categories', { method: 'POST', json: input }),
  updateCategory: (id, patch) => call(`/my/categories/${id}`, { method: 'PATCH', json: patch }),
  deleteCategory: (id) => call(`/my/categories/${id}`, { method: 'DELETE' }),
  createItem: (input) => call('/my/items', { method: 'POST', json: input }),
  updateItem: (id, patch) => call(`/my/items/${id}`, { method: 'PATCH', json: patch }),
  deleteItem: (id) => call(`/my/items/${id}`, { method: 'DELETE' }),

  async uploadImage(file) {
    const body = new FormData()
    body.append('file', file)
    return (await call<{ url: string }>('/my/upload', { method: 'POST', body })).url
  },
}
