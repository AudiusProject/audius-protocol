import { GENRES } from './genres'
import { MOODS } from './moods'

const filteredGenres = GENRES.reduce((acc, genre: string) => {
  acc = acc.concat(genre.split('/'))
  return acc
}, [] as string[]).map((genre) =>
  genre.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
)

export const restrictedHandles = new Set(
  [
    'discover',
    'account',
    'collection',
    'curated',
    'podcast',
    'library',
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

    // ===== Moods =====
    ...MOODS.map((mood) => mood.toLowerCase()),
    // ===== Genre =====
    ...filteredGenres
  ].map((h) => h.toLowerCase())
)

export default restrictedHandles
