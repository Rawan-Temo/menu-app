import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import path from 'node:path'
import fs from 'node:fs'
import { api, UPLOAD_DIR } from './routes'

const app = express()
app.set('trust proxy', 1) // behind nginx/Caddy – needed for correct rate limiting
const origins = (process.env.CORS_ORIGIN ?? '').split(',').map((s) => s.trim()).filter(Boolean)

app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(cors({ origin: origins.length ? origins : true }))
app.use(express.json({ limit: '1mb' }))

app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' }))
app.use('/api', api)

// In production one process serves both the API and the built React app.
const dist = path.resolve(__dirname, '../../client/dist')
if (fs.existsSync(dist)) {
  app.use(express.static(dist))
  app.get('/{*splat}', (_req, res) => res.sendFile(path.join(dist, 'index.html')))
}

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (!err.status) console.error(err)
  res.status(err.status ?? 500).json({ error: err.status ? err.message : 'Server error' })
})

const port = Number(process.env.PORT ?? 4000)
app.listen(port, () => console.log(`API ready on http://localhost:${port}`))
