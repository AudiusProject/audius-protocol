import { UpdateTrackRequest } from '@audius/sdk'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useSdk } from './useSdk'

type MutationContext = {
  previousTrack: any
}

export const useUpdateTrack = () => {
  const { data: sdk } = useSdk()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: UpdateTrackRequest) => {
      if (!sdk) throw new Error('SDK not initialized')

      const response = await sdk.tracks.updateTrack(params)

      return response
    },
    onMutate: async ({ trackId, metadata }): Promise<MutationContext> => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['track', trackId] })
      await queryClient.cancelQueries({ queryKey: ['collection'] })

      // Snapshot the previous values
      const previousTrack = queryClient.getQueryData(['track', trackId])

      // Optimistically update track
      queryClient.setQueryData(['track', trackId], (old: any) => ({
        ...old,
        ...metadata
      }))

      // Optimistically update all collections that contain this track
      queryClient.setQueriesData(
        { queryKey: ['collection'] },
        (oldData: any) => {
          if (!oldData?.tracks?.some((track: any) => track.id === trackId)) {
            return oldData
          }

          return {
            ...oldData,
            tracks: oldData.tracks.map((track: any) =>
              track.id === trackId
                ? {
                    ...track,
                    ...metadata
                  }
                : track
            )
          }
        }
      )

      // Return context with the previous track
      return { previousTrack }
    },
    onError: (_err, { trackId }, context?: MutationContext) => {
      // If the mutation fails, roll back track data
      if (context?.previousTrack) {
        queryClient.setQueryData(['track', trackId], context.previousTrack)
      }

      // Roll back all collections that contain this track
      queryClient.setQueriesData(
        { queryKey: ['collection'] },
        (oldData: any) => {
          if (!oldData?.tracks?.some((track: any) => track.id === trackId)) {
            return oldData
          }

          return {
            ...oldData,
            tracks: oldData.tracks.map((track: any) =>
              track.id === trackId ? context?.previousTrack : track
            )
          }
        }
      )
    },
    onSettled: (_, __, { trackId }) => {
      // Always refetch after error or success to ensure cache is in sync with server
      // queryClient.invalidateQueries({ queryKey: ['track', trackId] })
    }
  })
}
