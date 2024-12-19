import { Playlist, UpdatePlaylistRequest } from '@audius/sdk'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useSdk } from './useSdk'

type MutationContext = {
  previousCollection: Playlist
}

export const useUpdateCollection = () => {
  const { data: sdk } = useSdk()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: UpdatePlaylistRequest) => {
      if (!sdk) throw new Error('SDK not initialized')

      const response = await sdk.playlists.updatePlaylist(params)

      return response
    },
    onMutate: async ({ playlistId, metadata }): Promise<MutationContext> => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ['collection', playlistId]
      })

      // Snapshot the previous values
      const previousCollection = queryClient.getQueryData([
        'collection',
        playlistId
      ])

      // Optimistically update collection
      queryClient.setQueryData(['collection', playlistId], (old: any) => ({
        ...old,
        ...metadata
      }))

      // Return context with the previous collection
      return { previousCollection }
    },
    onError: (_err, { playlistId }, context?: MutationContext) => {
      // If the mutation fails, roll back collection data
      if (context?.previousCollection) {
        queryClient.setQueryData(
          ['collection', playlistId],
          context.previousCollection
        )
      }
    },
    onSettled: (_, __, { playlistId }) => {
      // Always refetch after error or success to ensure cache is in sync with server
      // queryClient.invalidateQueries({ queryKey: ['collection', playlistId] })
    }
  })
}
