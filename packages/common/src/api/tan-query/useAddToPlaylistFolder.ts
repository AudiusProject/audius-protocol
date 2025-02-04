import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { useAppContext } from '~/context/appContext'
import { FavoriteSource, Name } from '~/models/Analytics'
import {
  PlaylistLibrary,
  PlaylistLibraryID,
  PlaylistLibraryFolder
} from '~/models/PlaylistLibrary'
import { AccountUserMetadata } from '~/models/User'
import { playlistLibraryHelpers } from '~/store/playlist-library'
import { saveCollection } from '~/store/social/collections/actions'
import { toast } from '~/store/ui/toast/slice'

import { getCurrentAccountQueryKey } from './useCurrentAccount'
import { useCurrentUserId } from './useCurrentUserId'
import { usePlaylistLibrary } from './usePlaylistLibrary'
import { useUpdatePlaylistLibrary } from './useUpdatePlaylistLibrary'

type AddToFolderVariables = {
  entityId: PlaylistLibraryID
  folder: PlaylistLibraryFolder
}

type AddToFolderResult = {
  updatedLibrary: PlaylistLibrary
  entityId: PlaylistLibraryID
  folder: PlaylistLibraryFolder
}

const messages = {
  playlistMovedToFolderToast: (folderName: string) =>
    `This playlist was already in your library. It has now been moved to ${folderName}!`
}

/**
 * Hook to add items to a playlist folder
 */
export const useAddToPlaylistFolder = () => {
  const { data: currentUserId } = useCurrentUserId()
  const { data: playlistLibrary } = usePlaylistLibrary()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()
  const updatePlaylistLibrary = useUpdatePlaylistLibrary()
  const {
    analytics: { track, make }
  } = useAppContext()

  return useMutation<AddToFolderResult, Error, AddToFolderVariables>({
    mutationFn: async ({ entityId, folder }: AddToFolderVariables) => {
      if (!playlistLibrary || !currentUserId) {
        throw new Error('Missing required data')
      }

      const updatedLibrary = playlistLibraryHelpers.addPlaylistToFolder(
        playlistLibrary,
        entityId,
        folder.id
      )

      await updatePlaylistLibrary.mutateAsync(updatedLibrary)

      return {
        updatedLibrary,
        entityId,
        folder
      }
    },
    onSuccess: ({ updatedLibrary, entityId, folder }) => {
      // Invalidate the playlist library query
      queryClient.setQueryData(
        getCurrentAccountQueryKey(currentUserId),
        (old: AccountUserMetadata | undefined) => {
          if (!old) return old
          return { ...old, playlist_library: updatedLibrary }
        }
      )

      // If dragging in a new playlist, save to user collections
      if (typeof entityId === 'number') {
        const isNewAddition = !playlistLibrary?.contents.some(
          (item) => 'playlist_id' in item && item.playlist_id === entityId
        )
        if (isNewAddition) {
          dispatch(saveCollection(entityId, FavoriteSource.NAVIGATOR))
        }
      }

      // Show a toast if playlist dragged from outside of library was already in the library
      if (
        playlistLibraryHelpers.findInPlaylistLibrary(playlistLibrary!, entityId)
      ) {
        dispatch(
          toast({
            content: messages.playlistMovedToFolderToast(folder.name)
          })
        )
      }

      // Analytics
      track(
        make({
          eventName: Name.PLAYLIST_LIBRARY_ADD_PLAYLIST_TO_FOLDER
        })
      )
    }
  })
}
