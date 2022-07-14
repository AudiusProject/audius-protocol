import { ID, UID } from '@audius/common'

import { Collection } from 'common/models/Collection'
import Kind from 'common/models/Kind'
import Status from 'common/models/Status'
import { Track } from 'common/models/Track'
import { User } from 'common/models/User'
import { CommonState } from 'common/store'
import { getEntry, getAllEntries } from 'common/store/cache/selectors'
import { getTracks } from 'common/store/cache/tracks/selectors'
import {
  getUsers,
  getUser as getUserById
} from 'common/store/cache/users/selectors'
import { Uid } from 'common/utils/uid'

export const getCollection = (
  state: CommonState,
  props: { id?: ID | null; uid?: UID | null }
) => {
  return getEntry(state, {
    ...props,
    kind: Kind.COLLECTIONS
  })
}
export const getStatus = (state: CommonState, props: { id: ID }) =>
  state.collections.statuses[props.id] || null

export const getCollections = (
  state: CommonState,
  props?: { ids?: ID[] | null; uids?: UID[] | null }
) => {
  if (props && props.ids) {
    const collections: { [id: number]: Collection } = {}
    props.ids.forEach((id) => {
      const collection = getCollection(state, { id })
      if (collection) {
        collections[id] = collection
      }
    })
    return collections
  } else if (props && props.uids) {
    const collections: { [uid: string]: Collection } = {}
    props.uids.forEach((uid) => {
      const collection = getCollection(state, { uid })
      if (collection) {
        collections[collection.playlist_id] = collection
      }
    })
    return collections
  }
  return getAllEntries(state, { kind: Kind.COLLECTIONS })
}

export const getCollectionsByUid = (state: CommonState) => {
  return Object.keys(state.collections.uids).reduce((entries, uid) => {
    entries[uid] = getCollection(state, { uid })
    return entries
  }, {} as { [uid: string]: Collection | null })
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

export type EnhancedCollectionTrack = Track & { user: User; uid: UID }
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
      const track = tracks[id as unknown as number]
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
        ...tracks[t.track],
        uid: trackUid.toString(),
        user: users[tracks[t.track].owner_id]
      }
    })
    .filter(Boolean) as EnhancedCollectionTrack[]
}

type EnhancedCollection = Collection & { user: User }
export const getCollectionWithUser = (
  state: CommonState,
  props: { id?: ID }
): EnhancedCollection | null => {
  const collection = getCollection(state, { id: props.id })
  const userId = collection?.playlist_owner_id
  const user = getUserById(state, { id: userId })
  if (collection && user) {
    return {
      user,
      ...collection
    }
  }
  return null
}
