import { Kind } from 'models'
import { parseTrackRouteFromPermalink } from 'utils/stringUtils'

import { createApi } from './createApi'

const trackApi = createApi({
  reducerPath: 'trackApi',
  endpoints: {
    getTrackById: {
      fetch: async ({ id }, { apiClient }) => {
        return {
          track: await apiClient.getTrack({ id })
        }
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
        return {
          track: await apiClient.getTrackByHandleAndSlug({
            handle,
            slug,
            currentUserId
          })
        }
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
export default trackApi.reducer
