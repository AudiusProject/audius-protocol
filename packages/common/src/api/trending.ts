import { createApi } from '~/audius-query'
import { ID } from '~/models/Identifiers'
import { Kind } from '~/models/Kind'
import { TimeRange } from '~/models/TimeRange'
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
      fetch: async (args: GetTrendingArgs, { apiClient }) => {
        return await apiClient.getTrending(args)
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
