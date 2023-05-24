import { Kind } from 'models'
import { createApi } from 'src/audius-query/createApi'
import { parseTrackRouteFromPermalink } from 'utils/stringUtils'

const trackApi = createApi({
  reducerPath: 'trackApi',
  endpoints: {
    getTrackById: {
      fetch: async ({ id }: { id: number }, { apiClient }) => {
        return await apiClient.getTrack({ id })
      },
      options: {
        idArgKey: 'id',
        kind: Kind.TRACKS,
        schemaKey: 'track'
      }
    },
    getTrackByPermalink: {
      fetch: async ({ permalink, currentUserId }, { apiClient }) => {
        const { handle, slug } = parseTrackRouteFromPermalink(permalink)
        return await apiClient.getTrackByHandleAndSlug({
          handle,
          slug,
          currentUserId
        })
      },
      options: {
        permalinkArgKey: 'permalink',
        kind: Kind.TRACKS,
        schemaKey: 'track'
      }
    }
  }
})

export const { useGetTrackById, useGetTrackByPermalink } = trackApi.hooks
export const trackApiReducer = trackApi.reducer
