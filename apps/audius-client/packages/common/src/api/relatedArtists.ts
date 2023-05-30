import { ID } from 'models/Identifiers'
import { createApi } from 'src/audius-query/createApi'

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
