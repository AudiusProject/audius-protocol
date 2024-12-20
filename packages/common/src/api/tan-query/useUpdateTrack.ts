import { Track, UpdateTrackRequest } from '@audius/sdk'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useAppContext } from '~/context'

import { QUERY_KEYS } from './queryKeys'

type MutationContext = {
  previousTrack: any
}

export const useUpdateTrack = () => {
  const { audiusSdk } = useAppContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: UpdateTrackRequest) => {
      if (!audiusSdk) throw new Error('SDK not initialized')

      const response = await audiusSdk.tracks.updateTrack(params)

      return response
    },
    onMutate: async ({ trackId, metadata }): Promise<MutationContext> => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.track, trackId] })
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.collection] })

      // Snapshot the previous values
      const previousTrack = queryClient.getQueryData<Track>([
        QUERY_KEYS.track,
        trackId
      ])

      // Optimistically update track
      queryClient.setQueryData([QUERY_KEYS.track, trackId], (old: any) => ({
        ...old,
        ...metadata
      }))

      // Optimistically update all collections that contain this track
      queryClient.setQueriesData(
        { queryKey: [QUERY_KEYS.collection] },
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
        queryClient.setQueryData(
          [QUERY_KEYS.track, trackId],
          context.previousTrack
        )
      }

      // Roll back all collections that contain this track
      queryClient.setQueriesData(
        { queryKey: [QUERY_KEYS.collection] },
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
    onSettled: (_, __) => {
      // Always refetch after error or success to ensure cache is in sync with server
      // queryClient.invalidateQueries({ queryKey: ['track', trackId] })
    }
  })
}
