import { useQueryClient, useMutation, QueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'
import { Dispatch } from 'redux'

import { ID } from '~/models/Identifiers'
import { PlaylistLibrary } from '~/models/PlaylistLibrary'
import { accountActions } from '~/store/account'
import { removePlaylistLibraryDuplicates } from '~/store/playlist-library/helpers'

import { QUERY_KEYS } from './queryKeys'
import { useCurrentUser } from './useCurrentUser'

export const useUpdatePlaylistLibrary = () => {
  const { data: currentUser } = useCurrentUser()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()

  return useMutation({
    mutationFn: (playlistLibrary: PlaylistLibrary) => {
      updatePlaylistLibrary(
        currentUser?.user_id,
        playlistLibrary,
        queryClient,
        dispatch
      )

      return Promise.resolve()
    }
  })
}

// feature-tan-query TODO: migrate saga usages, then remove this
export const updatePlaylistLibrary = (
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

  // Triggers sync to local storage
  dispatch(accountActions.updatePlaylistLibrary(dedupedPlaylistLibrary))
}
