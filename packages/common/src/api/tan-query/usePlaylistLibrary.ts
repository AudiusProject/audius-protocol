import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { PlaylistLibrary } from '~/models/PlaylistLibrary'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'
import { useCurrentAccount } from './useCurrentAccount'

const STALE_TIME = 1000 * 60 * 5 // 5 minutes

/**
 * Hook to get the user's playlist library from the accountUser data
 */
export const usePlaylistLibrary = (config?: QueryOptions) => {
  const { data: accountUser } = useCurrentAccount()
  return useQuery({
    queryKey: [QUERY_KEYS.playlistLibrary, accountUser?.user.user_id],
    queryFn: () => {
      return accountUser?.playlist_library ?? { contents: [] }
    },
    staleTime: config?.staleTime ?? STALE_TIME,
    ...config
  })
}

export const useUpdatePlaylistLibrary = () => {
  const { data: accountUser } = useCurrentAccount()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (playlistLibrary: PlaylistLibrary) => {
      queryClient.setQueryData(
        [QUERY_KEYS.playlistLibrary, accountUser?.user.user_id],
        playlistLibrary
      )
      return Promise.resolve()
    }
  })
}
