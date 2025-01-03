import { full } from '@audius/sdk'

import { transformAndCleanList, userTrackMetadataFromSDK } from '~/adapters'
import { createApi } from '~/audius-query'
import { ID, Id, Kind, OptionalId } from '~/models'
import { Nullable } from '~/utils/typeUtils'

import { SDKRequest } from './types'

const trackApi = createApi({
  reducerPath: 'trackApi',
  endpoints: {
    getTrackById: {
      fetch: async (
        {
          id,
          currentUserId
        }: { id: ID | null | undefined; currentUserId?: Nullable<ID> },
        { audiusSdk }
      ) => {
        if (!id || id === -1) return null
        const sdk = await audiusSdk()
        const { data } = await sdk.full.tracks.getTrack({
          trackId: Id.parse(id),
          userId: OptionalId.parse(currentUserId)
        })
        return data ? userTrackMetadataFromSDK(data) : null
      },
      fetchBatch: async (
        { ids, currentUserId }: { ids: ID[]; currentUserId?: Nullable<ID> },
        { audiusSdk }
      ) => {
        const id = ids.filter((id) => id && id !== -1).map((id) => Id.parse(id))
        if (id.length === 0) return []

        const sdk = await audiusSdk()
        const { data = [] } = await sdk.full.tracks.getBulkTracks({
          id,
          userId: OptionalId.parse(currentUserId)
        })
        return transformAndCleanList(data, userTrackMetadataFromSDK)
      },
      options: {
        idArgKey: 'id',
        kind: Kind.TRACKS,
        schemaKey: 'track'
      }
    },
    getTracksByIds: {
      fetch: async (
        { ids, currentUserId }: { ids: ID[]; currentUserId: Nullable<ID> },
        { audiusSdk }
      ) => {
        const id = ids.filter((id) => id && id !== -1).map((id) => Id.parse(id))
        if (id.length === 0) return []

        const sdk = await audiusSdk()

        const { data = [] } = await sdk.full.tracks.getBulkTracks({
          id,
          userId: OptionalId.parse(currentUserId)
        })
        return transformAndCleanList(data, userTrackMetadataFromSDK)
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
          currentUserId,
          filterTracks = 'public',
          sort = 'date',
          ...params
        }: SDKRequest<full.GetTracksByUserHandleRequest>,
        { audiusSdk }
      ) => {
        const sdk = await audiusSdk()
        const { data = [] } = await sdk.full.users.getTracksByUserHandle({
          ...params,
          userId: OptionalId.parse(currentUserId),
          sort,
          filterTracks
        })
        return transformAndCleanList(data, userTrackMetadataFromSDK)
      },
      options: {
        idListArgKey: 'ids',
        kind: Kind.TRACKS,
        schemaKey: 'tracks'
      }
    }
  }
})

export const { useGetTrackById, useGetTracksByIds, useGetUserTracksByHandle } =
  trackApi.hooks
export const trackApiFetch = trackApi.fetch
export const trackApiReducer = trackApi.reducer
export const trackApiActions = trackApi.actions
