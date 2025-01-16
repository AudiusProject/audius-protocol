import { Id } from '@audius/sdk'

import { transformAndCleanList } from '~/adapters'
import { favoriteFromSDK } from '~/adapters/favorite'
import { createApi } from '~/audius-query'
import { ID } from '~/models/Identifiers'
import { Nullable } from '~/utils/typeUtils'

type GetFavoritedTrackListArgs = {
  currentUserId: Nullable<ID>
}

const favoritesApi = createApi({
  reducerPath: 'favoritesApi',
  endpoints: {
    getFavoritedTrackList: {
      fetch: async (args: GetFavoritedTrackListArgs, { audiusSdk }) => {
        const { currentUserId } = args
        if (!currentUserId) return null

        const sdk = await audiusSdk()
        const { data } = await sdk.users.getFavorites({
          id: Id.parse(currentUserId)
        })
        return transformAndCleanList(data, favoriteFromSDK)
      },
      options: {}
    }
  }
})

export const { useGetFavoritedTrackList } = favoritesApi.hooks
export const favoritesApiReducer = favoritesApi.reducer
