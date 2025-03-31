import { OptionalId } from '@audius/sdk'

import { transformAndCleanList, userTrackMetadataFromSDK } from '~/adapters'
import { createApi } from '~/audius-query'
import { ID } from '~/models/Identifiers'
import { Kind } from '~/models/Kind'
import { TimeRange } from '~/models/TimeRange'
import { StringKeys } from '~/services/remote-config'
import { Genre } from '~/utils/genres'
import { Nullable } from '~/utils/typeUtils'

type GetTrendingArgs = {
  timeRange: TimeRange
  genre: Nullable<Genre>
  offset: number
  limit: number
  currentUserId: Nullable<ID>
}

const trendingApi = createApi({
  reducerPath: 'trendingApi',
  endpoints: {
    getTrending: {
      fetch: async (
        { currentUserId, genre, limit, offset, timeRange }: GetTrendingArgs,
        { audiusSdk, remoteConfigInstance }
      ) => {
        const version = remoteConfigInstance.getRemoteVar(
          StringKeys.TRENDING_EXPERIMENT
        )
        const sdk = await audiusSdk()

        const args = {
          limit,
          offset,
          time: timeRange,
          genre: genre ?? undefined,
          userId: OptionalId.parse(currentUserId)
        }
        const { data = [] } = version
          ? await sdk.full.tracks.getTrendingTracksWithVersion({
              ...args,
              version
            })
          : await sdk.full.tracks.getTrendingTracks(args)
        return transformAndCleanList(data, userTrackMetadataFromSDK)
      },
      options: {
        kind: Kind.TRACKS,
        schemaKey: 'tracks'
      }
    }
  }
})

export const { useGetTrending } = trendingApi.hooks
export const trendingApiReducer = trendingApi.reducer
