import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'

import { accountFromSDK } from '~/adapters'
import { useAudiusQueryContext } from '~/audius-query'
import { PlaylistLibrary } from '~/models/PlaylistLibrary'
import { getWalletAddresses } from '~/store/account/selectors'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'
import { useCurrentUserId } from './useCurrentUserId'

const STALE_TIME = 1000 * 60 * 5 // 5 minutes

/**
 * Hook to get the user's playlist library from the accountUser data
 */
export const usePlaylistLibrary = (config?: QueryOptions) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  const { currentUser: wallet } = useSelector(getWalletAddresses)

  return useQuery({
    queryKey: [QUERY_KEYS.playlistLibrary, currentUserId],
    queryFn: async () => {
      const sdk = await audiusSdk()
      const { data } = await sdk.full.users.getUserAccount({
        wallet: wallet!
      })
      if (!data) {
        console.warn('Missing user from account response')
        return null
      }
      const account = accountFromSDK(data!)
      return account?.playlist_library ?? ({ contents: [] } as PlaylistLibrary)
    },
    staleTime: config?.staleTime ?? STALE_TIME,
    enabled: config?.enabled !== false && !!currentUserId,
    ...config
  })
}
