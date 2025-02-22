import { Id, OptionalId } from '@audius/sdk'
import { create, keyResolver, windowScheduler } from '@yornaath/batshit'
import { memoize, omit } from 'lodash'

import { userCollectionMetadataFromSDK } from '~/adapters/collection'
import { transformAndCleanList } from '~/adapters/utils'
import { ID } from '~/models/Identifiers'

import { TQCollection } from '../models'
import { primeCollectionData } from '../utils/primeCollectionData'

import { contextCacheResolver } from './contextCacheResolver'
import { BatchContext } from './types'

export const getCollectionsBatcher = memoize(
  (context: BatchContext) =>
    create({
      fetcher: async (ids: ID[]): Promise<TQCollection[]> => {
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

        const tqCollections: TQCollection[] = collections.map((c) => ({
          ...omit(c, ['tracks', 'user']),
          userId: c.user.user_id,
          tracks: c.tracks?.map((t) => t.track_id) ?? []
        }))
        return tqCollections
      },
      resolver: keyResolver('playlist_id'),
      scheduler: windowScheduler(10)
    }),
  contextCacheResolver()
)
