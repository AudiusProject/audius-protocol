import { transformAndCleanList, userTrackMetadataFromSDK } from '~/adapters'
import { createApi } from '~/audius-query'
import { ID, Id, Kind, OptionalId } from '~/models'
import { Nullable } from '~/utils/typeUtils'

const trackApi = createApi({
  reducerPath: 'trackApi',
  endpoints: {
    // Safe to remove when purchases api is migrated to react-query
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
    }
  }
})

export const { useGetTracksByIds } = trackApi.hooks
export const trackApiFetch = trackApi.fetch
export const trackApiReducer = trackApi.reducer
export const trackApiActions = trackApi.actions
