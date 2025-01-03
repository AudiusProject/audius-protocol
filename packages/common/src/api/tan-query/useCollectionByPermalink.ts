import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'

import { userCollectionMetadataFromSDK } from '~/adapters/collection'
import { useAppContext } from '~/context/appContext'
import { OptionalId } from '~/models'
import { getUserId } from '~/store/account/selectors'

import { QUERY_KEYS } from './queryKeys'
import { primeCollectionData } from './utils/primeCollectionData'

export const playlistPermalinkToHandleAndSlug = (permalink: string) => {
  const splitPermalink = permalink.split('/')
  if (splitPermalink.length !== 4) {
    throw Error(
      'Permalink formatted incorrectly. Should follow /<handle>/playlist/<slug> format.'
    )
  }
  const handle = splitPermalink[1]
  const slug = splitPermalink[3]
  return { handle, slug }
}

type Config = {
  staleTime?: number
  enabled?: boolean
}

export const useCollectionByPermalink = (
  permalink: string | undefined | null,
  config?: Config
) => {
  const { audiusSdk } = useAppContext()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()
  const currentUserId = useSelector(getUserId)

  return useQuery({
    queryKey: [QUERY_KEYS.collectionByPermalink, permalink],
    queryFn: async () => {
      if (!permalink || !audiusSdk) return null
      const { handle, slug } = playlistPermalinkToHandleAndSlug(permalink)
      const { data = [] } =
        await audiusSdk.full.playlists.getPlaylistByHandleAndSlug({
          handle,
          slug,
          userId: OptionalId.parse(currentUserId)
        })

      const collection = userCollectionMetadataFromSDK(data[0])

      if (collection) {
        // Prime related entities
        primeCollectionData({ collection, queryClient, dispatch })

        // Prime collection cache
        queryClient.setQueryData(
          [QUERY_KEYS.collection, collection.playlist_id],
          collection
        )
      }

      return collection
    },
    staleTime: config?.staleTime,
    enabled: config?.enabled !== false && !!audiusSdk && !!permalink
  })
}