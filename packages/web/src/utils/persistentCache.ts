import { set, get, keys, del, clear } from 'idb-keyval'
import { mergeWith } from 'lodash'

import { Collection } from 'common/models/Collection'
import { ID } from 'common/models/Identifiers'
import Kind from 'common/models/Kind'
import { Track } from 'common/models/Track'
import { User } from 'common/models/User'
import { mergeCustomizer } from 'common/store/cache/reducer'
import { makeUid } from 'common/utils/uid'

const DISABLE_PERSISTENCE_KEY = 'disable-cache-persistence'

const disableCachePersistence =
  !window.localStorage || window.localStorage.getItem(DISABLE_PERSISTENCE_KEY)

if (disableCachePersistence) {
  console.log('Cache persistence disabled')
}

// 5 minute TTL
const DEFAULT_TTL = 5 * 60 * 1000

type Cacheable<T> = { metadata: T; id: ID; _timestamp: number }
type CacheMetadata = Cacheable<Track> | Cacheable<Collection> | Cacheable<User>

const createPersistentKey = (kind: Kind, id: ID) => `${kind}-${id}`
const getKind = (key: string): Kind => {
  const kind = key.split('-')[0] as keyof typeof Kind
  return Kind[kind]
}
const isExpired = (item: CacheMetadata) =>
  item._timestamp + DEFAULT_TTL < Date.now()

let stopWrites = false

// TODO: Remove false check to re-enable
export const isCacheEnabled = () =>
  window && window.indexedDB && !disableCachePersistence && !stopWrites && false

// Add overloads to handle various kinds of cacheables.
export async function add(
  kind: Kind.TRACKS,
  id: ID,
  metadata: Cacheable<Track>,
  replace: boolean,
  transform?: (metadata: Cacheable<Track>) => Cacheable<Track>
): Promise<void>
export async function add(
  kind: Kind.COLLECTIONS,
  id: ID,
  metadata: Cacheable<Collection>,
  replace: boolean,
  transform?: (metadata: Cacheable<Collection>) => Cacheable<Collection>
): Promise<void>
export async function add(
  kind: Kind.USERS,
  id: ID,
  metadata: Cacheable<User>,
  replace: boolean,
  transform?: (metadata: Cacheable<User>) => Cacheable<User>
): Promise<void>
export async function add(
  kind: Kind,
  id: ID,
  metadata: CacheMetadata,
  replace = false,
  transform: (metadata: any) => any = metadata => metadata
): Promise<void> {
  if (!isCacheEnabled()) return

  const key = createPersistentKey(kind, id)
  const transformed = transform(metadata)
  const toAdd = { metadata: transformed, id, _timestamp: Date.now() }

  try {
    if (!replace) {
      const existing = await get<CacheMetadata>(key)
      if (existing) {
        const mergedMetadata = mergeWith(
          {},
          existing.metadata,
          transformed,
          mergeCustomizer
        )
        toAdd.metadata = mergedMetadata
      }
    }

    // // Set is async, but this can be fire and forgotten.
    set(key, toAdd)
  } catch (e) {
    // If it fails, we didn't persist, but that's totally fine because it will just be refetched some other time.
    console.error(
      `Err [${e.message}] adding persistent object [${JSON.stringify(
        metadata
      )}] with key [${key}]`
    )
  }
}

export async function update(
  kind: Kind.TRACKS,
  id: ID,
  metadata: Cacheable<Track>,
  transform?: (metadata: Cacheable<Track>) => Cacheable<Track>
): Promise<void>
export async function update(
  kind: Kind.COLLECTIONS,
  id: ID,
  metadata: Cacheable<Collection>,
  transform?: (metadata: Cacheable<Collection>) => Cacheable<Collection>
): Promise<void>
export async function update(
  kind: Kind.USERS,
  id: ID,
  metadata: Cacheable<User>,
  transform?: (metadata: Cacheable<User>) => Cacheable<User>
): Promise<void>
export async function update(
  kind: Kind,
  id: ID,
  metadata: CacheMetadata,
  transform: (metadata: any) => any = metadata => metadata
): Promise<void> {
  if (!isCacheEnabled()) return

  const key = createPersistentKey(kind, id)
  const toAdd = { metadata, id, _timestamp: Date.now() }

  const transformed = transform(metadata)
  try {
    const existing = await get<CacheMetadata>(key)
    // If the entry doesn't exist, don't trigger an update
    if (existing) {
      toAdd.metadata = mergeWith(
        {},
        existing.metadata,
        transformed,
        mergeCustomizer
      )
      set(key, toAdd)
    }
  } catch (e) {
    console.error(
      `Err [${e.message}] updating persistent object [${JSON.stringify(
        transformed
      )}] with key [${key}]`
    )
  }
}

// Gets all items and evicts those that have expired
export async function getAllItems() {
  if (!isCacheEnabled()) {
    return {
      collections: [],
      users: [],
      tracks: []
    }
  }

  console.time('Get all persisted')
  let allKeys
  try {
    allKeys = (await keys()) as string[]
  } catch (e) {
    console.error(`Got error fetching all keys: ${e.message}`)
    return {
      collections: [],
      users: [],
      tracks: []
    }
  }

  const collections: Array<Cacheable<Collection>> = []
  const users: Array<Cacheable<User>> = []
  const tracks: Array<Cacheable<Track>> = []
  const evict: string[] = []

  const items = (await Promise.all(allKeys.map(k => get(k)))) as CacheMetadata[]
  for (let i = 0; i < items.length; i++) {
    const [item, key] = [items[i], allKeys[i]]

    if (isExpired(item)) {
      evict.push(key)
      continue
    }

    const kind = getKind(key)
    switch (kind) {
      case Kind.USERS:
        users.push(item as Cacheable<User>)
        break
      case Kind.COLLECTIONS:
        collections.push(item as Cacheable<Collection>)
        break
      case Kind.TRACKS:
        tracks.push(item as Cacheable<Track>)
        break
      default:
        break
    }
  }

  console.info(`Evicting ${evict.length} items`)

  // Fire and forget the evictions
  evict.forEach(id => del(id))
  console.timeEnd('Get all persisted')

  return {
    collections: collections.map(e => ({
      ...e,
      uid: makeUid(Kind.COLLECTIONS, e.id)
    })),
    users: users.map(e => ({
      ...e,
      uid: makeUid(Kind.USERS, e.id)
    })),
    tracks: tracks.map(e => ({
      ...e,
      uid: makeUid(Kind.TRACKS, e.id)
    }))
  }
}

/**
 * Clears the entire persistent cache and stops new writes.
 * Can be fired and forgotten.
 */
export function clearAll() {
  stopWrites = true
  clear()
}
