import { Id, OptionalId } from '@audius/sdk'
import { create, keyResolver, windowScheduler } from '@yornaath/batshit'
import { memoize } from 'lodash'

import { userCollectionMetadataFromSDK } from '~/adapters/collection'
import { transformAndCleanList } from '~/adapters/utils'
import { UserCollectionMetadata } from '~/models/Collection'

import { primeCollectionData } from '../utils/primeCollectionData'

import { BatchContext, BatchQuery } from './types'

export const getCollectionsBatcher = memoize((context: BatchContext) =>
  create({
    fetcher: async (
      queries: BatchQuery[]
    ): Promise<UserCollectionMetadata[]> => {
      const { sdk, currentUserId, queryClient, dispatch } = context
      if (!queries.length) return []
      const ids = queries.map((q) => q.id)

      const { data } = await sdk.full.playlists.getBulkPlaylists({
        id: ids.map((id) => Id.parse(id)),
        userId: OptionalId.parse(currentUserId)
      })

      const collections = transformAndCleanList(
        data,
        userCollectionMetadataFromSDK
      )

      // Prime related entities
      primeCollectionData({
        collections,
        queryClient,
        dispatch,
        skipQueryData: true
      })

      return collections
    },
    resolver: keyResolver('playlist_id'),
    scheduler: windowScheduler(10)
  })
)
