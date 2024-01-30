import { restrictedHandles as commonRestrictedHandles } from '@audius/common/utils'
import { orderedRoutes } from 'audius-client/src/utils/route'

const restrictedRoutes = orderedRoutes
  .filter((routePath) => (routePath.match(/\//g) || []).length === 1)
  .filter((routePath) => !routePath.includes(':'))
  .map((routePath) => routePath.replace(/[^a-zA-Z0-9]/g, '').toLowerCase())
  .filter((routePath) => routePath !== '')
  .map((h) => h.toLowerCase())

export const restrictedHandles = new Set([
  // ===== Restricted Genres, Moods, and keywords come from common =====
  ...commonRestrictedHandles,
  // ===== Current Routes =====
  ...restrictedRoutes
])
