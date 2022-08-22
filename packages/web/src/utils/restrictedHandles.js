import { GENRES } from '@audius/common'

import { moodMap } from 'utils/moods'
import { orderedRoutes } from 'utils/route'

const restrictedRoutes = orderedRoutes
  .filter((routePath) => (routePath.match(/\//g) || []).length === 1)
  .filter((routePath) => !routePath.includes(':'))
  .map((routePath) => routePath.replace(/[^a-zA-Z0-9]/g, '').toLowerCase())
  .filter((routePath) => routePath !== '')

const filteredGenres = GENRES.reduce((acc, genre) => {
  acc = acc.concat(genre.split('/'))
  return acc
}, []).map((genre) => genre.replace(/[^a-zA-Z0-9]/g, '').toLowerCase())

export const restrictedHandles = new Set(
  [
    'discover',
    'account',
    'collection',
    'curated',
    'podcast',
    'Library',
    'next',
    'suggested',
    'follow',
    'stats',
    'radio',
    'like',
    'repost',
    'share',
    'social',
    'artist',
    'options',
    'billing',
    'support',
    'genre',
    'mood',
    'collections',
    'podcasts',
    'libraries',
    'suggestions',
    'following',
    'stations',
    'likes',
    'reposts',
    'artists',
    'notification',
    'message',
    'inbox',
    'genres',
    'moods',
    'embed',
    'crypto',
    'payment',
    'error',
    'search',
    'api',
    '200',
    '204',
    '400',
    '404',

    // ===== Current Routes =====
    ...restrictedRoutes,
    // ===== Moods =====
    ...Object.keys(moodMap).map((mood) => mood.toLowerCase()),
    // ===== Genre =====
    ...filteredGenres
  ].map((h) => h.toLowerCase())
)

export default restrictedHandles
