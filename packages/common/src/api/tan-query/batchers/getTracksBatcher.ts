import { Id, OptionalId } from '@audius/sdk'
import { QueryClient } from '@tanstack/react-query'
import { create, keyResolver, windowScheduler } from '@yornaath/batshit'
import { Dispatch } from 'redux'

import { userTrackMetadataFromSDK } from '~/adapters/track'
import { transformAndCleanList } from '~/adapters/utils'
import { ID } from '~/models/Identifiers'
import { UserTrackMetadata } from '~/models/Track'
import { removeNullable } from '~/utils/typeUtils'

import { primeTrackData } from '../utils/primeTrackData'

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

export const getTracksBatcher = create({
  fetcher: async (queries: BatchQuery[]): Promise<UserTrackMetadata[]> => {
    // Hack because batshit doesn't support context properly
    const { sdk, currentUserId, queryClient, dispatch } = queries[0].context
    if (!queries.length) return []
    const ids = queries.map((q) => q.id)
    const { data } = await sdk.full.tracks.getBulkTracks({
      id: ids.map((id: ID) => Id.parse(id)).filter(removeNullable),
      userId: OptionalId.parse(currentUserId)
    })

    const tracks = transformAndCleanList(data, userTrackMetadataFromSDK)
    primeTrackData({ tracks, queryClient, dispatch })

    return tracks
  },
  resolver: keyResolver('track_id'),
  scheduler: windowScheduler(10)
})
