import { Playlist } from '@audius/sdk'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { playlistMetadataForUpdateWithSDK } from '~/adapters/collection'
import { fileToSdk } from '~/adapters/track'
import { useAudiusQueryContext } from '~/audius-query'
import { Collection } from '~/models/Collection'
import { ID } from '~/models/Identifiers'
import { encodeHashId } from '~/utils/hashIds'

import { QUERY_KEYS } from './queryKeys'

type MutationContext = {
  previousCollection: Playlist | undefined
}

type UpdateCollectionParams = {
  playlistId: ID
  userId: ID
  metadata: Partial<Collection>
  coverArtFile?: File
}

export const useUpdateCollection = () => {
  const { audiusSdk } = useAudiusQueryContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      playlistId,
      userId,
      metadata,
      coverArtFile
    }: UpdateCollectionParams) => {
      const sdk = await audiusSdk()

      const encodedPlaylistId = encodeHashId(playlistId)
      const encodedUserId = encodeHashId(userId)
      if (!encodedPlaylistId || !encodedUserId) throw new Error('Invalid ID')

      const sdkMetadata = playlistMetadataForUpdateWithSDK(
        metadata as Collection
      )

      const response = await sdk.playlists.updatePlaylist({
        coverArtFile: coverArtFile
          ? fileToSdk(coverArtFile, 'cover_art')
          : undefined,
        playlistId: encodedPlaylistId,
        userId: encodedUserId,
        metadata: sdkMetadata
      })

      return response
    },
    onMutate: async ({ playlistId, metadata }): Promise<MutationContext> => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: [QUERY_KEYS.collection, playlistId]
      })

      // Snapshot the previous values
      const previousCollection = queryClient.getQueryData<Playlist>([
        QUERY_KEYS.collection,
        playlistId
      ])

      // Optimistically update collection
      queryClient.setQueryData(
        [QUERY_KEYS.collection, playlistId],
        (old: any) => ({
          ...old,
          ...metadata
        })
      )

      // Optimistically update collectionByPermalink
      queryClient.setQueryData(
        [QUERY_KEYS.collectionByPermalink, metadata.permalink],
        (old: any) => ({
          ...old,
          ...metadata
        })
      )

      // Return context with the previous collection
      return { previousCollection }
    },
    onError: (_err, { playlistId }, context?: MutationContext) => {
      // If the mutation fails, roll back collection data
      if (context?.previousCollection) {
        queryClient.setQueryData(
          [QUERY_KEYS.collection, playlistId],
          context.previousCollection
        )
        queryClient.setQueryData(
          [
            QUERY_KEYS.collectionByPermalink,
            context.previousCollection.permalink
          ],
          context.previousCollection
        )
      }
    },
    onSettled: (_, __) => {
      // Always refetch after error or success to ensure cache is in sync with server
      // queryClient.invalidateQueries({ queryKey: ['collection', playlistId] })
    }
  })
}
