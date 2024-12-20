import { Playlist, UpdatePlaylistRequest } from '@audius/sdk'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useAppContext } from '~/context/appContext'

import { QUERY_KEYS } from './queryKeys'

type MutationContext = {
  previousCollection?: Playlist
}

export const useUpdateCollection = () => {
  const { audiusSdk } = useAppContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: UpdatePlaylistRequest) => {
      if (!audiusSdk) throw new Error('SDK not initialized')

      const response = await audiusSdk.playlists.updatePlaylist(params)

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
    onSettled: (_, __) => {
      // Always refetch after error or success to ensure cache is in sync with server
      // queryClient.invalidateQueries({ queryKey: ['collection', playlistId] })
    }
  })
}
