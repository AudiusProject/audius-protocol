import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { useAppContext } from '~/context/appContext'
import { Name, FavoriteSource } from '~/models'
import {
  PlaylistLibrary,
  PlaylistLibraryID,
  PlaylistLibraryKind,
  PlaylistLibraryItem
} from '~/models/PlaylistLibrary'
import { playlistLibraryHelpers } from '~/store/playlist-library'
import { saveCollection } from '~/store/social/collections/actions'

import { QUERY_KEYS } from './queryKeys'
import { useCurrentUserId } from './useCurrentUserId'
import { usePlaylistLibrary } from './usePlaylistLibrary'
import { useUpdatePlaylistLibrary } from './useUpdatePlaylistLibrary'

type ReorderLibraryVariables = {
  draggingId: PlaylistLibraryID
  droppingId: PlaylistLibraryID
  draggingKind: PlaylistLibraryKind
}

type ReorderLibraryResult = {
  updatedLibrary: PlaylistLibrary
  draggingId: PlaylistLibraryID
  droppingId: PlaylistLibraryID
  draggingKind: PlaylistLibraryKind
}

/**
 * Hook to reorder items in the playlist library
 */
export const useReorderLibrary = () => {
  const { data: currentUserId } = useCurrentUserId()
  const { data: playlistLibrary } = usePlaylistLibrary()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()
  const { mutateAsync: updatePlaylistLibrary } = useUpdatePlaylistLibrary()
  const {
    analytics: { track, make }
  } = useAppContext()

  return useMutation<ReorderLibraryResult, Error, ReorderLibraryVariables>({
    mutationFn: async ({
      draggingId,
      droppingId,
      draggingKind
    }: ReorderLibraryVariables) => {
      if (!playlistLibrary || !currentUserId) {
        throw new Error('Missing required data')
      }

      const updatedLibrary = playlistLibraryHelpers.reorderPlaylistLibrary(
        playlistLibrary,
        draggingId,
        droppingId,
        draggingKind
      )

      await updatePlaylistLibrary(updatedLibrary)

      return {
        updatedLibrary,
        draggingId,
        droppingId,
        draggingKind
      }
    },
    onSuccess: ({ updatedLibrary, draggingId, droppingId, draggingKind }) => {
      // Invalidate the playlist library query
      queryClient.setQueryData(
        [QUERY_KEYS.playlistLibrary, currentUserId],
        updatedLibrary
      )

      // Analytics
      track(
        make({
          eventName: Name.PLAYLIST_LIBRARY_REORDER,
          containsTemporaryPlaylists: false,
          kind: draggingKind
        })
      )

      // If dragging in a new playlist, save to user collections
      if (draggingKind === 'playlist' && typeof draggingId === 'number') {
        const isNewAddition = !playlistLibrary?.contents.some(
          (item: PlaylistLibraryItem) =>
            'playlist_id' in item && item.playlist_id === draggingId
        )
        if (isNewAddition) {
          dispatch(saveCollection(draggingId, FavoriteSource.NAVIGATOR))
        }
      }

      // Track folder analytics
      const isIdInFolderBeforeReorder = playlistLibraryHelpers.isInsideFolder(
        playlistLibrary!,
        draggingId
      )
      const isDroppingIntoFolder = playlistLibraryHelpers.isInsideFolder(
        playlistLibrary!,
        droppingId
      )

      if (isIdInFolderBeforeReorder && !isDroppingIntoFolder) {
        track(
          make({
            eventName: Name.PLAYLIST_LIBRARY_MOVE_PLAYLIST_OUT_OF_FOLDER,
            containsTemporaryPlaylists: false,
            kind: draggingKind
          })
        )
      } else if (!isIdInFolderBeforeReorder && isDroppingIntoFolder) {
        track(
          make({
            eventName: Name.PLAYLIST_LIBRARY_MOVE_PLAYLIST_INTO_FOLDER,
            containsTemporaryPlaylists: false,
            kind: draggingKind
          })
        )
      }
    }
  })
}
