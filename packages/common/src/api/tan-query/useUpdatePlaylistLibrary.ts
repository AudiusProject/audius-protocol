import { useQueryClient, useMutation } from '@tanstack/react-query'
import { useSelector } from 'react-redux'

import { PlaylistLibrary } from '~/models/PlaylistLibrary'
import { getWalletAddresses } from '~/store/account/selectors'
import { removePlaylistLibraryDuplicates } from '~/store/playlist-library/helpers'

import { QUERY_KEYS } from './queryKeys'

export const useUpdatePlaylistLibrary = () => {
  const { currentUser } = useSelector(getWalletAddresses)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (playlistLibrary: PlaylistLibrary) => {
      const dedupedPlaylistLibrary =
        removePlaylistLibraryDuplicates(playlistLibrary)
      queryClient.setQueryData(
        [QUERY_KEYS.playlistLibrary, currentUser],
        dedupedPlaylistLibrary
      )
      return Promise.resolve()
    }
  })
}
