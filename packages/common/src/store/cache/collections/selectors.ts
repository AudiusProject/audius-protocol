import { QueryKey } from '@tanstack/react-query'
import { createSelector } from 'reselect'

import { getCollectionByPermalinkQueryKey } from '~/api'
import { QUERY_KEYS, getCollectionQueryKey } from '~/api/tan-query/queryKeys'
import { getTracks } from '~/store/cache/tracks/selectors'
import { getUser, getUser as getUserById } from '~/store/cache/users/selectors'
import type { CommonState } from '~/store/commonStore'
import { removeNullable } from '~/utils/typeUtils'
import { Uid } from '~/utils/uid'

import type { ID, UID, Collection, User } from '../../../models'

/** @deprecated Use a tan-query equivalent instead. useCollection or queryClient.getQueryData */
export const getCollection = (
  state: CommonState,
  props:
    | { id: ID | null | undefined }
    | { permalink: string | null }
    | { uid: string | null }
) => {
  if ('permalink' in props && props.permalink) {
    const collectionId = state.queryClient.getQueryData(
      getCollectionByPermalinkQueryKey(props.permalink)
    )
    return state.queryClient.getQueryData(getCollectionQueryKey(collectionId))
  } else if ('id' in props && props.id) {
    return state.queryClient.getQueryData(getCollectionQueryKey(props.id))
  } else if ('uid' in props && props.uid) {
    const collectionId = parseInt(Uid.fromString(props.uid).id as string, 10)
    return state.queryClient.getQueryData(getCollectionQueryKey(collectionId))
  }
  return undefined
}

/** @deprecated Use a tan-query equivalent instead. useCollections or queryClient.getQueriesData */
export const getCollections = (
  state: CommonState,
  props?:
    | {
        ids: ID[] | null
      }
    | {
        uids: UID[] | null
      }
    | {
        permalinks: string[] | null
      }
) => {
  if (props && 'ids' in props) {
    return props.ids?.reduce(
      (acc, id) => {
        const collection = getCollection(state, { id })
        if (collection) {
          acc[id] = collection
        }
        return acc
      },
      {} as { [id: number]: Collection }
    )
  } else if (props && 'uids' in props) {
    return props.uids?.reduce(
      (acc, uid) => {
        const collection = getCollection(state, { uid })
        if (collection) {
          acc[uid] = collection
        }
        return acc
      },
      {} as { [uid: string]: Collection }
    )
  } else if (props && 'permalinks' in props) {
    return props.permalinks?.reduce(
      (acc, permalink) => {
        const collection = getCollection(state, { permalink })
        if (collection) {
          acc[permalink] = collection
        }
        return acc
      },
      {} as { [permalink: string]: Collection }
    )
  }
  // Returns all tracks in cache. TODO: this horribly inefficient dear god why on earth was this done
  const collectionQueryResults = state.queryClient.getQueriesData({
    queryKey: [QUERY_KEYS.collection]
  })
  return collectionQueryResults.reduce((acc, queryData) => {
    const [, collection] = queryData as [QueryKey, Collection]
    if (collection !== undefined) {
      return {
        ...acc,
        [collection.playlist_id]: collection
      }
    }
    return acc
  }, {})
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
  const tracks = getTracks(state, { ids: trackIds })
  return Object.values(tracks ?? {})
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
