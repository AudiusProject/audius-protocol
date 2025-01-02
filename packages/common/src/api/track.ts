import { full } from '@audius/sdk'

import { transformAndCleanList, userTrackMetadataFromSDK } from '~/adapters'
import { createApi } from '~/audius-query'
import { ID, Id, Kind, OptionalId } from '~/models'
import { Nullable } from '~/utils/typeUtils'

import { SDKRequest } from './types'

const trackApi = createApi({
  reducerPath: 'trackApi',
  endpoints: {
    getTrackByPermalink: {
      fetch: async (
        {
          permalink,
          currentUserId
        }: { permalink: Nullable<string>; currentUserId: Nullable<ID> },
        { audiusSdk }
      ) => {
        if (!permalink) {
          console.error('Attempting to get track but permalink is null...')
          return
        }
        const sdk = await audiusSdk()
        const { data } = await sdk.full.tracks.getBulkTracks({
          permalink: [permalink],
          userId: OptionalId.parse(currentUserId)
        })
        return data && data.length > 0
          ? userTrackMetadataFromSDK(data[0])
          : null
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

export const {
  useGetTrackByPermalink,
  useGetTracksByIds,
  useGetUserTracksByHandle
} = trackApi.hooks
export const trackApiFetch = trackApi.fetch
export const trackApiReducer = trackApi.reducer
export const trackApiActions = trackApi.actions
