import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { useAppContext } from '~/context/appContext'
import { FavoriteSource, Name } from '~/models/Analytics'
import {
  PlaylistLibrary,
  PlaylistLibraryID,
  PlaylistLibraryKind,
  PlaylistLibraryItem
} from '~/models/PlaylistLibrary'
import { AccountUserMetadata } from '~/models/User'
import { playlistLibraryHelpers } from '~/store/playlist-library'
import { saveCollection } from '~/store/social/collections/actions'

import { getCurrentAccountQueryKey } from './useCurrentAccount'
import { useCurrentUserId } from './useCurrentUserId'
import { usePlaylistLibrary } from './usePlaylistLibrary'
import { useUpdatePlaylistLibrary } from './useUpdatePlaylistLibrary'

type ReorderLibraryVariables = {
  collectionId: PlaylistLibraryID
  destinationId: PlaylistLibraryID
  collectionType: PlaylistLibraryKind
}

type ReorderLibraryResult = {
  updatedLibrary: PlaylistLibrary
  collectionId: PlaylistLibraryID
  destinationId: PlaylistLibraryID
  collectionType: PlaylistLibraryKind
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
      collectionId,
      destinationId,
      collectionType
    }: ReorderLibraryVariables) => {
      if (!playlistLibrary || !currentUserId) {
        throw new Error('Missing required data')
      }

      const updatedLibrary = playlistLibraryHelpers.reorderPlaylistLibrary(
        playlistLibrary,
        collectionId,
        destinationId,
        collectionType
      )

      await updatePlaylistLibrary(updatedLibrary)

      return {
        updatedLibrary,
        collectionId,
        destinationId,
        collectionType
      }
    },
    onSuccess: ({
      updatedLibrary,
      collectionId,
      destinationId,
      collectionType
    }) => {
      // Invalidate the playlist library query
      queryClient.setQueryData(
        getCurrentAccountQueryKey(currentUserId),
        (old: AccountUserMetadata | undefined) => {
          if (!old) return old
          return { ...old, playlist_library: updatedLibrary }
        }
      )

      // Analytics
      track(
        make({
          eventName: Name.PLAYLIST_LIBRARY_REORDER,
          containsTemporaryPlaylists: false,
          kind: collectionType
        })
      )

      // If dragging in a new playlist, save to user collections
      if (collectionType === 'playlist' && typeof collectionId === 'number') {
        const isNewAddition = !playlistLibrary?.contents.some(
          (item: PlaylistLibraryItem) =>
            'playlist_id' in item && item.playlist_id === collectionId
        )
        if (isNewAddition) {
          dispatch(saveCollection(collectionId, FavoriteSource.NAVIGATOR))
        }
      }

      // Track folder analytics
      const isIdInFolderBeforeReorder = playlistLibraryHelpers.isInsideFolder(
        playlistLibrary!,
        collectionId
      )
      const isDroppingIntoFolder = playlistLibraryHelpers.isInsideFolder(
        playlistLibrary!,
        destinationId
      )

      if (isIdInFolderBeforeReorder && !isDroppingIntoFolder) {
        track(
          make({
            eventName: Name.PLAYLIST_LIBRARY_MOVE_PLAYLIST_OUT_OF_FOLDER,
            containsTemporaryPlaylists: false,
            kind: collectionType
          })
        )
      } else if (!isIdInFolderBeforeReorder && isDroppingIntoFolder) {
        track(
          make({
            eventName: Name.PLAYLIST_LIBRARY_MOVE_PLAYLIST_INTO_FOLDER,
            containsTemporaryPlaylists: false,
            kind: collectionType
          })
        )
      }
    }
  })
}
