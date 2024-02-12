import { createApi } from '~/audius-query'
import { ID } from '~/models/Identifiers'

const relatedArtistsApi = createApi({
  reducerPath: 'relatedArtistsApi',
  endpoints: {
    getRelatedArtists: {
      fetch: async ({ artistId }: { artistId: ID }, { apiClient }) =>
        await apiClient.getRelatedArtists({
          userId: artistId,
          limit: 50
        }),
      options: {
        schemaKey: 'users'
      }
    }
  }
})

export const { useGetRelatedArtists } = relatedArtistsApi.hooks
export const relatedArtistsApiReducer = relatedArtistsApi.reducer
