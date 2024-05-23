import { createApi } from '~/audius-query'
import { ID, Kind } from '~/models'
import { Nullable } from '~/utils'

const collectionApi = createApi({
  reducerPath: 'collectionApi',
  endpoints: {
    getPlaylistById: {
      fetch: async (
        {
          playlistId,
          currentUserId
        }: { playlistId: Nullable<ID>; currentUserId: Nullable<ID> },
        { apiClient }
      ) => {
        if (!playlistId) return null
        return (
          await apiClient.getPlaylist({
            playlistId,
            currentUserId
          })
        )[0]
      },
      fetchBatch: async (
        { ids, currentUserId }: { ids: ID[]; currentUserId: Nullable<ID> },
        { apiClient }
      ) => {
        return await apiClient.getPlaylists({ playlistIds: ids, currentUserId })
      },
      options: {
        idArgKey: 'playlistId',
        kind: Kind.COLLECTIONS,
        schemaKey: 'collection'
      }
    },
    // Note: Please do not use this endpoint yet as it depends on further changes on the DN side.
    getPlaylistByPermalink: {
      fetch: async (
        {
          permalink,
          currentUserId
        }: { permalink: string; currentUserId: Nullable<ID> },
        { apiClient }
      ) => {
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

export const { useGetPlaylistByPermalink, useGetPlaylistById } =
  collectionApi.hooks
export const collectionApiReducer = collectionApi.reducer
