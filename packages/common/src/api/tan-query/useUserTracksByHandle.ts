import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'

import { userTrackMetadataFromSDK } from '~/adapters/track'
import { transformAndCleanList } from '~/adapters/utils'
import { useAudiusQueryContext } from '~/audius-query'
import { OptionalId } from '~/models'
import { getUserId } from '~/store/account/selectors'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'
import { primeTrackData } from './utils/primeTrackData'

type GetTracksByUserHandleArgs = {
  handle: string | null | undefined
  filterTracks?: 'public' | 'unlisted' | 'all'
  sort?: 'date' | 'plays'
  limit?: number
  offset?: number
}

export const useUserTracksByHandle = (
  args: GetTracksByUserHandleArgs,
  options?: QueryOptions
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()
  const currentUserId = useSelector(getUserId)

  const { handle, filterTracks = 'public', sort = 'date', limit, offset } = args

  return useQuery({
    queryKey: [
      QUERY_KEYS.userTracksByHandle,
      handle,
      filterTracks,
      sort,
      limit,
      offset
    ],
    queryFn: async () => {
      const sdk = await audiusSdk()
      const { data = [] } = await sdk.full.users.getTracksByUserHandle({
        handle: handle!,
        userId: OptionalId.parse(currentUserId),
        filterTracks,
        sort,
        limit,
        offset
      })

      const tracks = transformAndCleanList(data, userTrackMetadataFromSDK)

      tracks.forEach((track) => {
        primeTrackData({ track, queryClient, dispatch })
      })

      return tracks
    },
    staleTime: options?.staleTime,
    enabled: options?.enabled !== false && !!handle
  })
}
