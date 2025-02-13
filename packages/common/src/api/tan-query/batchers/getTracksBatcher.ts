import { Id, OptionalId } from '@audius/sdk'
import { create, keyResolver, windowScheduler } from '@yornaath/batshit'
import { memoize } from 'lodash'

import { userTrackMetadataFromSDK } from '~/adapters/track'
import { transformAndCleanList } from '~/adapters/utils'
import { ID } from '~/models/Identifiers'
import { UserTrackMetadata } from '~/models/Track'

import { primeTrackData } from '../utils/primeTrackData'

import { BatchContext } from './types'

export const getTracksBatcher = memoize((context: BatchContext) =>
  create({
    fetcher: async (ids: ID[]): Promise<UserTrackMetadata[]> => {
      const { sdk, currentUserId, queryClient, dispatch } = context
      if (!ids.length) return []
      const { data } = await sdk.full.tracks.getBulkTracks({
        id: ids.map((id) => Id.parse(id)),
        userId: OptionalId.parse(currentUserId)
      })

      const tracks = transformAndCleanList(data, userTrackMetadataFromSDK)
      primeTrackData({ tracks, queryClient, dispatch, skipQueryData: true })

      return tracks
    },
    resolver: keyResolver('track_id'),
    scheduler: windowScheduler(10)
  })
)
