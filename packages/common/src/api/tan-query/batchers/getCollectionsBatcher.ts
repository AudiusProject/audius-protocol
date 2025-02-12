import { Id, OptionalId } from '@audius/sdk'
import { QueryClient } from '@tanstack/react-query'
import { create, keyResolver, windowScheduler } from '@yornaath/batshit'
import { Dispatch } from 'redux'

import { userCollectionMetadataFromSDK } from '~/adapters/collection'
import { transformAndCleanList } from '~/adapters/utils'
import { ID } from '~/models'
import { UserCollectionMetadata } from '~/models/Collection'
import { removeNullable } from '~/utils/typeUtils'

import { primeCollectionData } from '../utils/primeCollectionData'

export type BatchContext = {
  sdk: any
  currentUserId: ID | null | undefined
  queryClient: QueryClient
  dispatch: Dispatch
}

export type BatchQuery = {
  id: ID
  context: BatchContext
}

export const getCollectionsBatcher = create({
  fetcher: async (queries: BatchQuery[]): Promise<UserCollectionMetadata[]> => {
    // Hack because batshit doesn't support context properly
    const { sdk, currentUserId, queryClient, dispatch } = queries[0].context
    if (!queries.length) return []
    const ids = queries.map((q) => q.id)

    const { data } = await sdk.full.playlists.getBulkPlaylists({
      playlistId: ids.map((id: ID) => Id.parse(id)).filter(removeNullable),
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
      dispatch
    })

    return collections
  },
  resolver: keyResolver('playlist_id'),
  scheduler: windowScheduler(10)
})
