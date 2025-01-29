import { AudiusSdk } from '@audius/sdk'
import { useQueryClient, useMutation, QueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'
import { Dispatch } from 'redux'

import { useAudiusQueryContext } from '~/audius-query/AudiusQueryContext'
import { ID } from '~/models/Identifiers'
import { PlaylistLibrary } from '~/models/PlaylistLibrary'
import { accountActions } from '~/store/account'
import { removePlaylistLibraryDuplicates } from '~/store/playlist-library/helpers'

import { QUERY_KEYS } from './queryKeys'
import { useCurrentUserId } from './useCurrentUserId'
import { updateUser } from './useUpdateUser'

export const useUpdatePlaylistLibrary = () => {
  const { data: currentUserId } = useCurrentUserId()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()
  const { audiusSdk } = useAudiusQueryContext()
  return useMutation({
    mutationFn: async (playlistLibrary: PlaylistLibrary) => {
      updatePlaylistLibrary(
        await audiusSdk(),
        currentUserId,
        playlistLibrary,
        queryClient,
        dispatch
      )
    }
  })
}

// feature-tan-query TODO: migrate saga usages, then remove this
export const updatePlaylistLibrary = async (
  audiusSdk: AudiusSdk,
  userId: ID | null | undefined,
  playlistLibrary: PlaylistLibrary,
  queryClient: QueryClient,
  dispatch: Dispatch<any>
) => {
  if (!userId) return
  const dedupedPlaylistLibrary =
    removePlaylistLibraryDuplicates(playlistLibrary)
  queryClient.setQueryData(
    [QUERY_KEYS.playlistLibrary, userId],
    dedupedPlaylistLibrary
  )

  await updateUser(audiusSdk, userId, {
    playlist_library: dedupedPlaylistLibrary
  })

  // feature-tan-query TODO: just set localStorage directly
  // Triggers sync to local storage
  dispatch(accountActions.updatePlaylistLibrary(dedupedPlaylistLibrary))
}
