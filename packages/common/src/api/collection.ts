import {
  transformAndCleanList,
  userCollectionMetadataFromSDK
} from '~/adapters'
import { createApi } from '~/audius-query'
import { ID, Id, Kind, OptionalId } from '~/models'
import { Nullable } from '~/utils'

const collectionApi = createApi({
  reducerPath: 'collectionApi',
  endpoints: {
    getPlaylistById: {
      fetch: async (
        {
          playlistId,
          currentUserId
        }: { playlistId: Nullable<ID>; currentUserId?: Nullable<ID> },
        { audiusSdk }
      ) => {
        if (!playlistId) return null
        const sdk = await audiusSdk()
        const { data = [] } = await sdk.full.playlists.getPlaylist({
          playlistId: Id.parse(playlistId),
          userId: OptionalId.parse(currentUserId)
        })
        return data.length ? userCollectionMetadataFromSDK(data[0]) : null
      },
      fetchBatch: async (
        { ids, currentUserId }: { ids: ID[]; currentUserId?: Nullable<ID> },
        { audiusSdk }
      ) => {
        const sdk = await audiusSdk()
        const { data = [] } = await sdk.full.playlists.getBulkPlaylists({
          id: ids.map((id) => Id.parse(id)),
          userId: OptionalId.parse(currentUserId)
        })
        return transformAndCleanList(data, userCollectionMetadataFromSDK)
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
