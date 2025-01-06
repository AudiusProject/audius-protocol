import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { userCollectionMetadataFromSDK } from '~/adapters/collection'
import { transformAndCleanList } from '~/adapters/utils'
import { useAppContext } from '~/context/appContext'
import { Id, OptionalId } from '~/models/Identifiers'

import { QUERY_KEYS } from './queryKeys'
import { useCurrentUserId } from './useCurrentUserId'
import { primeCollectionData } from './utils/primeCollectionData'

type GetPlaylistsOptions = {
  userId: number | null
  limit?: number
  offset?: number
}

type Config = {
  staleTime?: number
  enabled?: boolean
}

export const useUserPlaylists = (
  options: GetPlaylistsOptions,
  config?: Config
) => {
  const { audiusSdk } = useAppContext()
  const { data: currentUserId } = useCurrentUserId()
  const { userId, limit, offset } = options
  const queryClient = useQueryClient()
  const dispatch = useDispatch()

  return useQuery({
    queryKey: [QUERY_KEYS.userPlaylists, userId, limit, offset],
    queryFn: async () => {
      if (!userId || !audiusSdk) return []

      const { data } = await audiusSdk.full.users.getPlaylistsByUser({
        id: Id.parse(userId),
        userId: OptionalId.parse(currentUserId),
        limit,
        offset
      })

      const collections = transformAndCleanList(
        data,
        userCollectionMetadataFromSDK
      )

      primeCollectionData({ collections, queryClient, dispatch })

      return collections
    },
    staleTime: config?.staleTime,
    enabled: config?.enabled !== false && !!audiusSdk && !!userId
  })
}
