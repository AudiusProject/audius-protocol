import { Id, OptionalId } from '@audius/sdk'
import { create, keyResolver, windowScheduler } from '@yornaath/batshit'
import { memoize } from 'lodash'

import { userCollectionMetadataFromSDK } from '~/adapters/collection'
import { transformAndCleanList } from '~/adapters/utils'
import { UserCollectionMetadata } from '~/models/Collection'
import { ID } from '~/models/Identifiers'

import { primeCollectionData } from '../utils/primeCollectionData'

import { contextCacheResolver } from './contextCacheResolver'
import { BatchContext } from './types'

export const getCollectionsBatcher = memoize(
  (context: BatchContext) =>
    create({
      fetcher: async (ids: ID[]): Promise<UserCollectionMetadata[]> => {
        const { sdk, currentUserId, queryClient, dispatch } = context
        if (!ids.length) return []

        const { data } = await sdk.full.playlists.getBulkPlaylists({
          id: ids.map((id) => Id.parse(id)),
          userId: OptionalId.parse(currentUserId)
        })

        const collections = transformAndCleanList(
          data,
          userCollectionMetadataFromSDK
        )

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
    }),
  contextCacheResolver()
)
