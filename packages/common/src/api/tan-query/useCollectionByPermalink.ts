import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'

import { userCollectionMetadataFromSDK } from '~/adapters/collection'
import { useAppContext } from '~/context'
import { Kind, OptionalId } from '~/models'
import { getUserId } from '~/store/account/selectors'
import { addEntries } from '~/store/cache/actions'
import { EntriesByKind } from '~/store/cache/types'

import { QUERY_KEYS } from './queryKeys'

export const playlistPermalinkToHandleAndSlug = (permalink: string) => {
  const splitPermalink = permalink.split('/')
  if (splitPermalink.length !== 4) {
    throw Error(
      'Permalink formatted incorrectly. Should follow /<handle>/playlist/<slug> format.'
    )
  }
  const [, handle, , slug] = splitPermalink
  return { handle, slug }
}

type Config = {
  staleTime?: number
  enabled?: boolean
}

export const useCollectionByPermalink = (
  permalink: string | undefined,
  config?: Config
) => {
  const { audiusSdk } = useAppContext()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()
  const currentUserId = useSelector(getUserId)

  return useQuery({
    queryKey: [QUERY_KEYS.collectionByPermalink, permalink],
    queryFn: async () => {
      if (!permalink) return null
      const { handle, slug } = playlistPermalinkToHandleAndSlug(permalink)
      const { data = [] } =
        await audiusSdk!.full.playlists.getPlaylistByHandleAndSlug({
          handle,
          slug,
          userId: OptionalId.parse(currentUserId)
        })

      const collection = userCollectionMetadataFromSDK(data[0])

      if (collection) {
        // Prime user data from collection owner
        if (collection.user) {
          queryClient.setQueryData(
            [QUERY_KEYS.user, collection.user.user_id],
            collection.user
          )
        }

        // Prime track and user data from tracks in collection
        const entries: EntriesByKind = {
          [Kind.COLLECTIONS]: {
            [collection.playlist_id]: collection
          }
        }

        if (collection.user) {
          if (!entries[Kind.USERS]) entries[Kind.USERS] = {}
          entries[Kind.USERS][collection.user.user_id] = collection.user
        }

        // Track and user data from tracks in collection
        collection.tracks?.forEach((track) => {
          if (track.track_id) {
            // Prime track data
            queryClient.setQueryData([QUERY_KEYS.track, track.track_id], track)
            if (!entries[Kind.TRACKS]) entries[Kind.TRACKS] = {}
            entries[Kind.TRACKS][track.track_id] = track

            // Prime user data from track owner
            if (track.user) {
              queryClient.setQueryData(
                [QUERY_KEYS.user, track.user.user_id],
                track.user
              )
              if (!entries[Kind.USERS]) entries[Kind.USERS] = {}
              entries[Kind.USERS][track.user.user_id] = track.user
            }
          }
        })

        // Sync all data to Redux in a single dispatch
        dispatch(addEntries(entries, undefined, undefined, 'react-query'))
      }

      return collection
    },
    staleTime: config?.staleTime,
    enabled: config?.enabled !== false && !!audiusSdk && !!permalink
  })
}
