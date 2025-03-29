import { Id } from '@audius/sdk'
import { useQuery } from '@tanstack/react-query'
import { pick } from 'lodash'
import { useDispatch, useSelector } from 'react-redux'

import { userCollectionMetadataFromSDK } from '~/adapters/collection'
import { useAudiusQueryContext } from '~/audius-query'
import { getUserId } from '~/store/account/selectors'

import { TQCollection } from './models'
import { QUERY_KEYS } from './queryKeys'
import { useTypedQueryClient } from './typed-query-client'
import { QueryOptions, SelectableQueryOptions } from './types'
import { useCollection } from './useCollection'
import { primeCollectionData } from './utils/primeCollectionData'

const STALE_TIME = Infinity

export const getCollectionByPermalinkQueryKey = (
  permalink: string | undefined | null
) => [QUERY_KEYS.collectionByPermalink, permalink] as const

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

export const useCollectionByPermalink = <TResult = TQCollection>(
  permalink: string | undefined | null,
  options?: SelectableQueryOptions<TQCollection, TResult>
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const queryClient = useTypedQueryClient()
  const dispatch = useDispatch()
  const currentUserId = useSelector(getUserId)

  const simpleOptions = pick(options, [
    'enabled',
    'staleTime',
    'placeholderData'
  ]) as QueryOptions

  const { data: collectionId } = useQuery<number | undefined>({
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

      return collection?.playlist_id
    },
    staleTime: simpleOptions?.staleTime ?? STALE_TIME,
    enabled: simpleOptions?.enabled !== false && !!permalink
  })

  return useCollection(collectionId, options)
}
