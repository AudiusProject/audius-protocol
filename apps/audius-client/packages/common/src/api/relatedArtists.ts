import { createApi } from './createApi'

const relatedArtistsApi = createApi({
  reducerPath: 'relatedArtistsApi',
  endpoints: {
    getRelatedArtists: {
      fetch: async ({ artistId }, { apiClient }) =>
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
export default relatedArtistsApi.reducer
