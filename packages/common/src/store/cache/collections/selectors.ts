import { getAllEntries, getEntry } from '~/store/cache/selectors'
import { getUser as getUserById } from '~/store/cache/users/selectors'
import type { CommonState } from '~/store/commonStore'

import type { ID, UID, Collection, User } from '../../../models'
import { Status, Kind } from '../../../models'

import type { BatchCachedCollections } from './types'

/** @deprecated Use useCollection instead */
export const getCollection = (
  state: CommonState,
  props: { id?: ID | null; uid?: UID | null; permalink?: string | null }
) => {
  const permalink = props.permalink?.toLowerCase()
  if (permalink && state.collections.permalinks[permalink]) {
    props.id = state.collections.permalinks[permalink]
  }
  return getEntry(state, {
    ...props,
    kind: Kind.COLLECTIONS
  })
}
export const getStatus = (state: CommonState, props: { id: ID }) =>
  state.collections.statuses[props.id] || null

/** @deprecated Use useCollections instead */
export const getCollections = (
  state: CommonState,
  props?: {
    ids?: ID[] | null
    uids?: UID[] | null
    permalinks?: string[] | null
  }
): { [id: number]: BatchCachedCollections } => {
  if (props && props.ids) {
    const collections: {
      [id: number]: BatchCachedCollections
    } = {}
    props.ids.forEach((id) => {
      const collection = getCollection(state, { id })
      if (collection) {
        collections[id] = { metadata: collection }
      }
    })
    return collections
  } else if (props && props.uids) {
    const collections: { [uid: string]: BatchCachedCollections } = {}
    props.uids.forEach((uid) => {
      const collection = getCollection(state, { uid })
      if (collection) {
        collections[collection.playlist_id] = { metadata: collection }
      }
    })
    return collections
  } else if (props && props.permalinks) {
    const collections: { [permalink: string]: BatchCachedCollections } = {}
    props.permalinks.forEach((permalink) => {
      const collection = getCollection(state, { permalink })
      if (collection) collections[permalink] = { metadata: collection }
    })
    return collections
  }
  return getAllEntries(state, { kind: Kind.COLLECTIONS })
}

export const getCollectionsByUid = (state: CommonState) => {
  return Object.keys(state.collections.uids).reduce(
    (entries, uid) => {
      entries[uid] = getCollection(state, { uid })
      return entries
    },
    {} as { [uid: string]: Collection | null }
  )
}

export const getStatuses = (state: CommonState, props: { ids: ID[] }) => {
  const statuses: { [id: number]: Status } = {}
  props.ids.forEach((id) => {
    const status = getStatus(state, { id })
    if (status) {
      statuses[id] = status
    }
  })
  return statuses
}

export type EnhancedCollection = Collection & { user: User }
export const getCollectionWithUser = (
  state: CommonState,
  props: { id?: ID }
): EnhancedCollection | null => {
  const collection = getCollection(state, { id: props.id })
  const userId = collection?.playlist_owner_id
  const user = getUserById(state, { id: userId })
  if (collection && user) {
    return {
      ...collection,
      user
    }
  }
  return null
}
