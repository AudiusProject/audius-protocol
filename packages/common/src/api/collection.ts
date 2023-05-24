import { Kind } from 'models'
import { createApi } from 'src/audius-query/createApi'

const collectionApi = createApi({
  reducerPath: 'collectionApi',
  endpoints: {
    getPlaylistByPermalink: {
      fetch: async ({ permalink, currentUserId }, { apiClient }) => {
        return (
          await apiClient.getPlaylistByPermalink({
            permalink,
            currentUserId
          })
        )[0]
      },
      options: {
        permalinkArgKey: 'permalink',
        kind: Kind.COLLECTIONS,
        schemaKey: 'collection'
      }
    }
  }
})

export const { useGetPlaylistByPermalink } = collectionApi.hooks
export const collectionApiReducer = collectionApi.reducer
