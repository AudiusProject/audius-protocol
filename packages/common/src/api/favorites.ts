import { createApi } from '~/audius-query'
import { ID } from '~/models/Identifiers'
import { Nullable } from '~/utils/typeUtils'

type GetFavoritedTrackListArgs = {
  currentUserId: Nullable<ID>
  limit?: number
}

const favoritesApi = createApi({
  reducerPath: 'favoritesApi',
  endpoints: {
    getFavoritedTrackList: {
      fetch: async (args: GetFavoritedTrackListArgs, { apiClient }) => {
        const { currentUserId, limit = 10000 } = args
        if (!currentUserId) return null
        return await apiClient.getFavorites({ currentUserId, limit })
      },
      options: {}
    }
  }
})

export const { useGetFavoritedTrackList } = favoritesApi.hooks
export const favoritesApiReducer = favoritesApi.reducer
