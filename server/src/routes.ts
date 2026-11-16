import { Router, type Request, type Response, type NextFunction } from 'express'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import multer from 'multer'
import rateLimit from 'express-rate-limit'
import crypto from 'node:crypto'
import path from 'node:path'
import fs from 'node:fs'
import { z } from 'zod'

const prisma = new PrismaClient()
export const api = Router()

export const UPLOAD_DIR = path.resolve(__dirname, '../uploads')
fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-only-secret'
if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET.startsWith('change-me'))) {
  console.error('Set a real JWT_SECRET in server/.env before running in production')
  process.exit(1)
}

class HttpError extends Error {
  constructor(public status: number, message: string) { super(message) }
}

const TAGS = ['vegetarian', 'vegan', 'spicy', 'glutenFree', 'new'] as const
const LANGS = ['en', 'ar', 'ku', 'tr'] as const

/* ---------- helpers ---------- */

const ownerOnly = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) throw new HttpError(401, 'Please sign in')
    const { uid } = jwt.verify(token, JWT_SECRET) as { uid: string }
    const user = await prisma.user.findUnique({ where: { id: uid }, include: { restaurant: true } })
    if (!user || !user.restaurant) throw new HttpError(401, 'Please sign in')
    res.locals.user = user
    res.locals.restaurantId = user.restaurant.id
    next()
  } catch {
    next(new HttpError(401, 'Please sign in'))
  }
}

const parse = <T extends z.ZodTypeAny>(schema: T, body: unknown): z.infer<T> => {
  const r = schema.safeParse(body)
  if (!r.success) throw new HttpError(400, r.error.issues[0]?.message ?? 'Invalid data')
  return r.data
}

const full = {
  categories: { orderBy: { sort: 'asc' as const }, include: { items: { orderBy: { sort: 'asc' as const } } } },
}

const toMenu = (r: any) => {
  const { ownerId, createdAt, ...rest } = r
  return {
    ...rest,
    categories: r.categories.map((c: any) => ({
      id: c.id, name: c.name, nameAlt: c.nameAlt, sort: c.sort,
      items: c.items.map(({ tags, ...i }: any) => ({ ...i, tags: tags ? tags.split(',') : [] })),
    })),
  }
}

const sign = (uid: string) => jwt.sign({ uid }, JWT_SECRET, { expiresIn: '30d' })

/* ---------- auth ---------- */

const authLimiter = rateLimit({ windowMs: 15 * 60_000, limit: 30, standardHeaders: true, legacyHeaders: false })
const slugSchema = z.string().regex(/^[a-z0-9-]{3,40}$/, 'Link name: 3–40 lowercase letters, numbers or dashes')

api.post('/auth/register', authLimiter, async (req, res) => {
  if (process.env.ALLOW_REGISTER === 'false') throw new HttpError(403, 'Sign-ups are closed')
  const b = parse(z.object({
    email: z.string().email(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    restaurantName: z.string().min(2).max(80),
    slug: slugSchema,
  }), req.body)
  if (await prisma.user.findUnique({ where: { email: b.email.toLowerCase() } })) throw new HttpError(409, 'Email already registered')
  if (await prisma.restaurant.findUnique({ where: { slug: b.slug } })) throw new HttpError(409, 'That link name is taken')
  const user = await prisma.user.create({
    data: {
      email: b.email.toLowerCase(),
      passwordHash: await bcrypt.hash(b.password, 10),
      restaurant: { create: { slug: b.slug, name: b.restaurantName } },
    },
  })
  res.status(201).json({ token: sign(user.id) })
})

api.post('/auth/login', authLimiter, async (req, res) => {
  const b = parse(z.object({ email: z.string().email(), password: z.string() }), req.body)
  const user = await prisma.user.findUnique({ where: { email: b.email.toLowerCase() } })
  if (!user || !(await bcrypt.compare(b.password, user.passwordHash))) throw new HttpError(401, 'Wrong email or password')
  res.json({ token: sign(user.id) })
})

api.get('/me', ownerOnly, (_req, res) => { res.json({ email: res.locals.user.email }) })

/* ---------- public ---------- */

api.get('/public/:slug', async (req, res) => {
  const r = await prisma.restaurant.findUnique({ where: { slug: req.params.slug }, include: full })
  if (!r) throw new HttpError(404, 'Menu not found')
  res.set('Cache-Control', 'public, max-age=30')
  res.json(toMenu(r))
})

/* ---------- owner: menu ---------- */

api.get('/my/menu', ownerOnly, async (_req, res) => {
  const r = await prisma.restaurant.findUniqueOrThrow({ where: { id: res.locals.restaurantId }, include: full })
  res.json(toMenu(r))
})

const text = (max: number) => z.string().max(max).nullable().optional().transform((v) => (v ? v : null))

api.patch('/my/restaurant', ownerOnly, async (req, res) => {
  const b = parse(z.object({
    name: z.string().min(2).max(80),
    nameAlt: text(80), tagline: text(140), taglineAlt: text(140),
    logoUrl: text(500), coverUrl: text(500),
    accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    currency: z.string().min(1).max(5),
    lang: z.enum(LANGS), altLang: z.enum(LANGS),
    phone: text(30), instagram: text(60),
  }).partial(), req.body)
  await prisma.restaurant.update({ where: { id: res.locals.restaurantId }, data: b })
  res.json({ ok: true })
})

const catBody = z.object({ name: z.string().min(1).max(60), nameAlt: text(60), sort: z.number().int() })

api.post('/my/categories', ownerOnly, async (req, res) => {
  const b = parse(catBody.omit({ sort: true }), req.body)
  const last = await prisma.category.aggregate({ where: { restaurantId: res.locals.restaurantId }, _max: { sort: true } })
  const c = await prisma.category.create({ data: { ...b, restaurantId: res.locals.restaurantId, sort: (last._max.sort ?? -1) + 1 } })
  res.status(201).json(c)
})

const ownCategory = async (req: Request, res: Response) => {
  const c = await prisma.category.findFirst({ where: { id: req.params.id as string, restaurantId: res.locals.restaurantId } })
  if (!c) throw new HttpError(404, 'Category not found')
}

api.patch('/my/categories/:id', ownerOnly, async (req, res) => {
  await ownCategory(req, res)
  await prisma.category.update({ where: { id: req.params.id as string }, data: parse(catBody.partial(), req.body) })
  res.json({ ok: true })
})

api.delete('/my/categories/:id', ownerOnly, async (req, res) => {
  await ownCategory(req, res)
  await prisma.category.delete({ where: { id: req.params.id as string } })
  res.status(204).end()
})

const itemBody = z.object({
  categoryId: z.string(),
  name: z.string().min(1).max(120),
  nameAlt: text(120), description: text(600), descriptionAlt: text(600),
  price: z.number().min(0),
  imageUrl: text(500),
  tags: z.array(z.enum(TAGS)),
  available: z.boolean(),
  featured: z.boolean(),
  sort: z.number().int(),
})

const ownItem = async (req: Request, res: Response) => {
  const i = await prisma.item.findFirst({ where: { id: req.params.id as string, category: { restaurantId: res.locals.restaurantId } } })
  if (!i) throw new HttpError(404, 'Item not found')
}

const assertCategory = async (id: string | undefined, restaurantId: string) => {
  if (id && !(await prisma.category.findFirst({ where: { id, restaurantId } }))) throw new HttpError(400, 'Invalid category')
}

api.post('/my/items', ownerOnly, async (req, res) => {
  const { tags, ...b } = parse(itemBody.omit({ sort: true }), req.body)
  await assertCategory(b.categoryId, res.locals.restaurantId)
  const last = await prisma.item.aggregate({ where: { categoryId: b.categoryId }, _max: { sort: true } })
  const i = await prisma.item.create({ data: { ...b, tags: tags.join(','), sort: (last._max.sort ?? -1) + 1 } })
  res.status(201).json(i)
})

api.patch('/my/items/:id', ownerOnly, async (req, res) => {
  await ownItem(req, res)
  const { tags, ...b } = parse(itemBody.partial(), req.body)
  await assertCategory(b.categoryId, res.locals.restaurantId)
  await prisma.item.update({ where: { id: req.params.id as string }, data: { ...b, ...(tags ? { tags: tags.join(',') } : {}) } })
  res.json({ ok: true })
})

api.delete('/my/items/:id', ownerOnly, async (req, res) => {
  await ownItem(req, res)
  await prisma.item.delete({ where: { id: req.params.id as string } })
  res.status(204).end()
})

/* ---------- uploads ---------- */

const EXT: Record<string, string> = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' }
const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${EXT[file.mimetype]}`),
  }),
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, file.mimetype in EXT),
})

api.post('/my/upload', ownerOnly, upload.single('file'), (req, res) => {
  if (!req.file) throw new HttpError(400, 'Upload a JPG, PNG or WebP image (max 4 MB)')
  res.status(201).json({ url: `/uploads/${req.file.filename}` })
})
