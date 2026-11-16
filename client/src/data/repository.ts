import type { Item, Menu, Restaurant } from '../lib/types'

export type ItemInput = Omit<Item, 'id' | 'sort'>
export type RestaurantPatch = Partial<Omit<Restaurant, 'id' | 'slug'>>
export type CategoryInput = { name: string; nameAlt: string | null }

/**
 * The ONLY thing the UI talks to. Two implementations exist:
 *   - http.ts     → your Express + Prisma + SQLite API   (VITE_BACKEND=local)
 *   - firebase.ts → Firestore + Auth + Storage           (VITE_BACKEND=firebase)
 * Add a third (Supabase, PocketBase…) by implementing this interface – no UI changes.
 */
export interface MenuRepository {
  // public
  getPublicMenu(slug: string): Promise<Menu | null>

  // auth
  getSession(): Promise<{ email: string } | null>
  login(email: string, password: string): Promise<void>
  register(input: { email: string; password: string; restaurantName: string; slug: string }): Promise<void>
  logout(): Promise<void>

  // owner
  getMyMenu(): Promise<Menu>
  updateRestaurant(patch: RestaurantPatch): Promise<void>
  createCategory(input: CategoryInput): Promise<void>
  updateCategory(id: string, patch: Partial<CategoryInput> & { sort?: number }): Promise<void>
  deleteCategory(id: string): Promise<void>
  createItem(input: ItemInput): Promise<void>
  updateItem(id: string, patch: Partial<ItemInput> & { sort?: number }): Promise<void>
  deleteItem(id: string): Promise<void>
  uploadImage(file: File): Promise<string>
}
