import { createApi } from '~/audius-query'
import { ID, Kind } from '~/models'
import { CommonState } from '~/store'
import { getQueryParams } from '~/utils'
import { parseTrackRouteFromPermalink } from '~/utils/stringUtils'
import { Nullable } from '~/utils/typeUtils'

const trackApi = createApi({
  reducerPath: 'trackApi',
  endpoints: {
    getTrackById: {
      fetch: async (
        { id, currentUserId }: { id: ID; currentUserId?: Nullable<ID> },
        { apiClient }
      ) => {
        return await apiClient.getTrack({ id, currentUserId })
      },
      fetchBatch: async (
        { ids, currentUserId }: { ids: ID[]; currentUserId?: Nullable<ID> },
        { apiClient }
      ) => {
        return (
          (await apiClient.getTracks({
            ids,
            currentUserId: currentUserId ?? null
          })) ?? []
        )
      },
      options: {
        idArgKey: 'id',
        kind: Kind.TRACKS,
        schemaKey: 'track'
      }
    },
    getTrackStreamUrl: {
      fetch: async (
        { id, currentUserId }: { id: ID; currentUserId?: Nullable<ID> },
        { apiClient, audiusBackend }
      ) => {
        if (id === -1) {
          return
        }
        const queryParams = await getQueryParams({
          audiusBackendInstance: audiusBackend
        })
        return await apiClient.getTrackStreamUrl({
          id,
          currentUserId,
          queryParams
        })
      },
      options: {
        idArgKey: 'stream-url',
        kind: Kind.TRACKS,
        schemaKey: 'stream-url'
      }
    },
    getTrackByPermalink: {
      fetch: async (
        {
          permalink,
          currentUserId
        }: { permalink: Nullable<string>; currentUserId: Nullable<ID> },
        { apiClient }
      ) => {
        if (!permalink) {
          console.error('Attempting to get track but permalink is null...')
          return
        }
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
        { ids, currentUserId }: { ids: ID[]; currentUserId: Nullable<ID> },
        { apiClient }
      ) => {
        return await apiClient.getTracks({ ids, currentUserId })
      },
      options: {
        idListArgKey: 'ids',
        kind: Kind.TRACKS,
        schemaKey: 'tracks'
      }
    },
    getUserTracksByHandle: {
      fetch: async (
        {
          handle,
          currentUserId,
          limit
        }: { handle: string; currentUserId: Nullable<ID>; limit?: number },
        { apiClient }
      ) => {
        return await apiClient.getUserTracksByHandle({
          handle,
          currentUserId,
          getUnlisted: false,
          limit
        })
      },
      options: {
        idListArgKey: 'ids',
        kind: Kind.TRACKS,
        schemaKey: 'tracks'
      }
    }
  }
})

export const {
  useGetTrackById,
  useGetTrackStreamUrl,
  useGetTrackByPermalink,
  useGetTracksByIds,
  useGetUserTracksByHandle
} = trackApi.hooks
export const trackApiFetch = trackApi.fetch
export const trackApiReducer = trackApi.reducer

export const getTrackStreamUrl = (
  state: CommonState,
  { trackId, currentUserId }: { trackId: ID; currentUserId?: Nullable<ID> }
) =>
  state.api.trackApi.getTrackStreamUrl?.[
    `{"id":${trackId},"currentUserId":${currentUserId}}`
  ]?.nonNormalizedData?.['stream-url']
