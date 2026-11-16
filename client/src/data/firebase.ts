import { initializeApp } from 'firebase/app'
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, type User,
} from 'firebase/auth'
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc, collection, getDocs, query, where, orderBy, limit, writeBatch,
} from 'firebase/firestore'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import type { MenuRepository } from './repository'
import type { Menu, Item } from '../lib/types'

const env = import.meta.env
const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  appId: env.VITE_FIREBASE_APP_ID,
})
const auth = getAuth(app)
const db = getFirestore(app)
const storage = getStorage(app)

/*  Firestore layout
 *  restaurants/{slug}              → restaurant fields + ownerUid     (slug is the doc id)
 *  restaurants/{slug}/categories/{id}
 *  restaurants/{slug}/items/{id}   → has categoryId
 */

const userReady = new Promise<User | null>((resolve) => {
  const off = onAuthStateChanged(auth, (u) => { off(); resolve(u) })
})
const currentUser = async () => { await userReady; return auth.currentUser }

async function mySlug() {
  const u = await currentUser()
  if (!u) throw new Error('Please sign in')
  const s = await getDocs(query(collection(db, 'restaurants'), where('ownerUid', '==', u.uid), limit(1)))
  if (s.empty) throw new Error('No restaurant found for this account')
  return s.docs[0].id
}

const clean = <T extends object>(o: T): T => JSON.parse(JSON.stringify(o))
const col = (slug: string, name: 'categories' | 'items') => collection(db, 'restaurants', slug, name)

const defaults = {
  nameAlt: null, tagline: null, taglineAlt: null, logoUrl: null, coverUrl: null,
  accent: '#E8590C', currency: 'IQD', lang: 'en', altLang: 'ar', phone: null, instagram: null,
}

async function loadMenu(slug: string): Promise<Menu | null> {
  const r = await getDoc(doc(db, 'restaurants', slug))
  if (!r.exists()) return null
  const [cs, is] = await Promise.all([
    getDocs(query(col(slug, 'categories'), orderBy('sort'))),
    getDocs(query(col(slug, 'items'), orderBy('sort'))),
  ])
  const items = is.docs.map((d) => ({
    nameAlt: null, description: null, descriptionAlt: null, imageUrl: null, tags: [], available: true, featured: false,
    ...d.data(), id: d.id,
  })) as unknown as Item[]
  const { ownerUid: _o, ...rest } = r.data()
  return {
    ...defaults, ...rest, id: slug, slug,
    categories: cs.docs.map((d) => ({
      nameAlt: null, ...d.data(), id: d.id, items: items.filter((i) => i.categoryId === d.id),
    })),
  } as unknown as Menu
}

const nextSort = (docs: { data(): { sort?: number } }[]) =>
  docs.length ? Math.max(...docs.map((d) => d.data().sort ?? 0)) + 1 : 0

const friendly = (e: unknown): never => {
  const code = (e as { code?: string }).code ?? ''
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) throw new Error('Wrong email or password')
  if (code.includes('email-already-in-use')) throw new Error('Email already registered')
  if (code.includes('weak-password')) throw new Error('Password must be at least 8 characters')
  throw e
}

export const firebaseRepository: MenuRepository = {
  getPublicMenu: loadMenu,

  async getSession() {
    const u = await currentUser()
    return u ? { email: u.email ?? '' } : null
  },
  async login(email, password) {
    try { await signInWithEmailAndPassword(auth, email, password) } catch (e) { friendly(e) }
  },
  async register({ email, password, restaurantName, slug }) {
    if ((await getDoc(doc(db, 'restaurants', slug))).exists()) throw new Error('That link name is taken')
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      await setDoc(doc(db, 'restaurants', slug), { ...defaults, name: restaurantName, ownerUid: cred.user.uid })
    } catch (e) { friendly(e) }
  },
  logout: () => signOut(auth),

  async getMyMenu() {
    const m = await loadMenu(await mySlug())
    if (!m) throw new Error('Menu not found')
    return m
  },
  async updateRestaurant(patch) {
    await updateDoc(doc(db, 'restaurants', await mySlug()), clean(patch))
  },

  async createCategory(input) {
    const slug = await mySlug()
    const existing = await getDocs(col(slug, 'categories'))
    await addDoc(col(slug, 'categories'), { ...input, sort: nextSort(existing.docs) })
  },
  async updateCategory(id, patch) {
    await updateDoc(doc(db, 'restaurants', await mySlug(), 'categories', id), clean(patch))
  },
  async deleteCategory(id) {
    const slug = await mySlug()
    const batch = writeBatch(db)
    const its = await getDocs(query(col(slug, 'items'), where('categoryId', '==', id)))
    its.forEach((d) => batch.delete(d.ref))
    batch.delete(doc(db, 'restaurants', slug, 'categories', id))
    await batch.commit()
  },

  async createItem(input) {
    const slug = await mySlug()
    const existing = await getDocs(query(col(slug, 'items'), where('categoryId', '==', input.categoryId)))
    await addDoc(col(slug, 'items'), { ...clean(input), sort: nextSort(existing.docs) })
  },
  async updateItem(id, patch) {
    await updateDoc(doc(db, 'restaurants', await mySlug(), 'items', id), clean(patch))
  },
  async deleteItem(id) {
    await deleteDoc(doc(db, 'restaurants', await mySlug(), 'items', id))
  },

  async uploadImage(file) {
    const slug = await mySlug()
    const r = ref(storage, `restaurants/${slug}/${Date.now()}-${file.name.replace(/[^\w.-]/g, '_')}`)
    await uploadBytes(r, file)
    return getDownloadURL(r)
  },
}
