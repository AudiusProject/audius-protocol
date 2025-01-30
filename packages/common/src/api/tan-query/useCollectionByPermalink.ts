import { Id } from '@audius/sdk'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'

import { userCollectionMetadataFromSDK } from '~/adapters/collection'
import { useAudiusQueryContext } from '~/audius-query'
import { getUserId } from '~/store/account/selectors'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'
import { primeCollectionData } from './utils/primeCollectionData'

const STALE_TIME = Infinity

export const getCollectionByPermalinkQueryKey = (
  permalink: string | undefined | null
) => [QUERY_KEYS.collectionByPermalink, permalink]

const playlistPermalinkToHandleAndSlug = (permalink: string) => {
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

export const useCollectionByPermalink = (
  permalink: string | undefined | null,
  options?: QueryOptions
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()
  const currentUserId = useSelector(getUserId)

  return useQuery({
    queryKey: getCollectionByPermalinkQueryKey(permalink),
    queryFn: async () => {
      const { handle, slug } = playlistPermalinkToHandleAndSlug(permalink!)
      const sdk = await audiusSdk()
      const { data = [] } = await sdk.full.playlists.getPlaylistByHandleAndSlug(
        {
          handle,
          slug,
          userId: Id.parse(currentUserId)
        }
      )

      const collection = userCollectionMetadataFromSDK(data[0])

      if (collection) {
        // Prime related entities
        primeCollectionData({
          collections: [collection],
          queryClient,
          dispatch
        })
      }

      return collection
    },
    staleTime: options?.staleTime ?? STALE_TIME,
    enabled: options?.enabled !== false && !!permalink
  })
}
