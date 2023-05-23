import { Kind } from 'models'

import { createApi } from './createApi'

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
export default collectionApi.reducer
