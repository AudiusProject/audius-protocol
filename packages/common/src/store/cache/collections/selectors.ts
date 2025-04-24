import { createSelector } from 'reselect'

import { getAllEntries, getEntry } from '~/store/cache/selectors'
import { getTrack, getTracks } from '~/store/cache/tracks/selectors'
import {
  getUser,
  getUser as getUserById,
  getUsers
} from '~/store/cache/users/selectors'
import type { CommonState } from '~/store/commonStore'
import { removeNullable } from '~/utils/typeUtils'
import { Uid } from '~/utils/uid'

import type { ID, UID, Collection, User, Cacheable } from '../../../models'
import { Status, Kind } from '../../../models'

import type { EnhancedCollectionTrack } from './types'

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

export type BatchCachedCollections = Omit<Cacheable<Collection>, '_timestamp'>
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

export const getCollectionTracks = (
  state: CommonState,
  { id }: { id?: ID }
) => {
  const collection = getCollection(state, { id })
  if (!collection) return null

  const trackIds = collection.playlist_contents.track_ids.map(
    ({ track }) => track
  )
  const tracks = trackIds
    .map((trackId) => getTrack(state, { id: trackId }))
    .filter(removeNullable)

  return tracks
}

export const getCollectionDuration = createSelector(
  [getCollectionTracks],
  (collectionTracks) =>
    collectionTracks?.reduce((acc, track) => acc + track.duration, 0) ?? 0
)

export const getCollectionTracksWithUsers = (
  state: CommonState,
  { id }: { id?: ID }
) => {
  const tracks = getCollectionTracks(state, { id })
  return tracks
    ?.map((track) => {
      const user = getUser(state, { id: track.owner_id })
      if (!user) return null
      return { ...track, user }
    })
    .filter(removeNullable)
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

const emptyList: EnhancedCollectionTrack[] = []
export const getTracksFromCollection = (
  state: CommonState,
  props: { uid: UID }
) => {
  const collection = getCollection(state, props)

  if (
    !collection ||
    !collection.playlist_contents ||
    !collection.playlist_contents.track_ids
  )
    return emptyList

  const collectionSource = Uid.fromString(props.uid).source

  const ids = collection.playlist_contents.track_ids.map((t) => t.track)
  const tracks = getTracks(state, { ids })

  const userIds = Object.keys(tracks)
    .map((id) => {
      const track = tracks[id as unknown as number].metadata
      if (track?.owner_id) {
        return track.owner_id
      }
      console.error(`Found empty track ${id}, expected it to have an owner_id`)
      return null
    })
    .filter((userId) => userId !== null) as number[]
  const users = getUsers(state, { ids: userIds })

  if (!users || Object.keys(users).length === 0) return emptyList

  // Return tracks & rebuild UIDs for the track so they refer directly to this collection
  return collection.playlist_contents.track_ids
    .map((t, i) => {
      const trackUid = Uid.fromString(t.uid ?? '')
      trackUid.source = `${collectionSource}:${trackUid.source}`
      trackUid.count = i

      if (!tracks[t.track]) {
        console.error(`Found empty track ${t.track}`)
        return null
      }
      return {
        ...tracks[t.track].metadata,
        uid: trackUid.toString(),
        user: users[tracks[t.track].metadata.owner_id].metadata
      }
    })
    .filter(Boolean) as EnhancedCollectionTrack[]
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
