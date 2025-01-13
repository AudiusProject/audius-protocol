import { Id, OptionalId } from '@audius/sdk'

import { userMetadataFromSDK } from '~/adapters'
import { transformAndCleanList } from '~/adapters/utils'
import { createApi } from '~/audius-query'
import { ID } from '~/models/Identifiers'
import { Nullable } from '~/utils'

const relatedArtistsApi = createApi({
  reducerPath: 'relatedArtistsApi',
  endpoints: {
    getRelatedArtists: {
      fetch: async (
        {
          artistId,
          currentUserId
        }: { artistId: ID; currentUserId?: Nullable<ID> },
        { audiusSdk }
      ) => {
        const sdk = await audiusSdk()

        const { data } = await sdk.full.users.getRelatedUsers({
          id: Id.parse(artistId),
          limit: 50,
          userId: OptionalId.parse(currentUserId)
        })
        return transformAndCleanList(data, userMetadataFromSDK)
      },
      options: {
        schemaKey: 'users'
      }
    }
  }
})

export const { useGetRelatedArtists } = relatedArtistsApi.hooks
export const relatedArtistsApiReducer = relatedArtistsApi.reducer
