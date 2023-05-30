import { ID, Kind } from 'models'
import { createApi } from 'src/audius-query/createApi'
import { parseTrackRouteFromPermalink } from 'utils/stringUtils'

const trackApi = createApi({
  reducerPath: 'trackApi',
  endpoints: {
    getTrackById: {
      fetch: async ({ id }: { id: ID }, { apiClient }) => {
        return await apiClient.getTrack({ id })
      },
      options: {
        idArgKey: 'id',
        kind: Kind.TRACKS,
        schemaKey: 'track'
      }
    },
    getTrackByPermalink: {
      fetch: async (
        { permalink, currentUserId }: { permalink: string; currentUserId: ID },
        { apiClient }
      ) => {
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
    },
    getTracksByIds: {
      fetch: async (
        { ids, currentUserId }: { ids: ID[]; currentUserId: ID },
        { apiClient }
      ) => {
        return await apiClient.getTracks({ ids, currentUserId })
      },
      options: {
        idListArgKey: 'ids',
        kind: Kind.TRACKS,
        schemaKey: 'tracks'
      }
    }
  }
})

export const { useGetTrackById, useGetTrackByPermalink, useGetTracksByIds } =
  trackApi.hooks
export const trackApiReducer = trackApi.reducer
