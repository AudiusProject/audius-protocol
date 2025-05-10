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

        console.log('calling api')

        try {
          const { data } = await sdk.full.playlists.getBulkPlaylists({
            id: ids.map((id) => Id.parse(id)),
            userId: OptionalId.parse(currentUserId)
          })

          console.log('data', data)

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
            trackIds: c.tracks?.map((t) => t.track_id) ?? []
          }))
          console.log('returning tqCollections', tqCollections)
          return tqCollections
        } catch (e) {
          console.error('error!', e)
          throw e
        }
      },
      resolver: keyResolver('playlist_id'),
      scheduler: windowScheduler(10)
    }),
  contextCacheResolver()
)
