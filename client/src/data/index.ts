import type { MenuRepository } from './repository'

/**
 * Pick the backend with VITE_BACKEND=local|firebase (client/.env). Nothing else in the app changes.
 * The implementation is loaded lazily, so the Firebase SDK is never downloaded in local mode.
 */
export const BACKEND = (import.meta.env.VITE_BACKEND ?? 'local') as 'local' | 'firebase'

let impl: Promise<MenuRepository> | undefined
const load = () =>
  (impl ??= BACKEND === 'firebase'
    ? import('./firebase').then((m) => m.firebaseRepository)
    : import('./http').then((m) => m.httpRepository))

export const repo = new Proxy({} as MenuRepository, {
  get: (_t, key: string) => async (...args: unknown[]) => ((await load()) as any)[key](...args),
})
