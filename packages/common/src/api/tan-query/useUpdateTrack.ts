import { Track } from '@audius/sdk'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useDispatch, useStore } from 'react-redux'

import { fileToSdk, trackMetadataForUploadToSdk } from '~/adapters/track'
import { useAudiusQueryContext } from '~/audius-query'
import { Feature } from '~/models/ErrorReporting'
import { Id, ID } from '~/models/Identifiers'
import { CommonState } from '~/store/commonStore'
import { stemsUploadSelectors } from '~/store/stems-upload'
import { TrackMetadataForUpload } from '~/store/upload'

import { QUERY_KEYS } from './queryKeys'
import { handleStemUpdates } from './utils/handleStemUpdates'

const { getCurrentUploads } = stemsUploadSelectors

type MutationContext = {
  previousTrack: Track | undefined
}

type UpdateTrackParams = {
  trackId: ID
  userId: ID
  metadata: Partial<TrackMetadataForUpload>
  coverArtFile?: File
}

export const useUpdateTrack = () => {
  const { audiusSdk, reportToSentry } = useAudiusQueryContext()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()
  const store = useStore()

  return useMutation({
    mutationFn: async ({
      trackId,
      userId,
      metadata,
      coverArtFile
    }: UpdateTrackParams) => {
      const sdk = await audiusSdk()

      const previousMetadata = queryClient.getQueryData<Track>([
        QUERY_KEYS.track,
        trackId
      ])
      const sdkMetadata = trackMetadataForUploadToSdk(
        metadata as TrackMetadataForUpload
      )

      const response = await sdk.tracks.updateTrack({
        coverArtFile: coverArtFile
          ? fileToSdk(coverArtFile, 'cover_art')
          : undefined,
        trackId: Id.parse(trackId),
        userId: Id.parse(userId),
        metadata: sdkMetadata
      })

      // TODO: migrate stem uploads to use tan-query
      const inProgressStemUploads = getCurrentUploads(
        store.getState() as CommonState,
        trackId
      )
      if (previousMetadata) {
        handleStemUpdates(
          metadata,
          previousMetadata as any,
          inProgressStemUploads,
          dispatch
        )
      }

      // TODO: remixOf event tracking, see trackNewRemixEvent saga

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

      // Optimistically update trackByPermalink
      if (previousTrack) {
        queryClient.setQueryData(
          [QUERY_KEYS.trackByPermalink, previousTrack.permalink],
          (old: any) => ({
            ...old,
            ...metadata
            // TODO: add optimistic update for artwork
          })
        )
        queryClient.setQueryData(
          [QUERY_KEYS.trackByPermalink, metadata.permalink],
          (old: any) => ({
            ...previousTrack,
            ...old,
            ...metadata
          })
        )
      }

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

      // Return context with the previous track and metadata
      return { previousTrack }
    },
    onError: (
      error,
      { trackId, userId, metadata },
      context?: MutationContext
    ) => {
      // If the mutation fails, roll back track data
      if (context?.previousTrack) {
        queryClient.setQueryData(
          [QUERY_KEYS.track, trackId],
          context.previousTrack
        )
        queryClient.setQueryData(
          [QUERY_KEYS.trackByPermalink, context.previousTrack.permalink],
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

      reportToSentry({
        error,
        additionalInfo: {
          trackId,
          userId,
          metadata
        },
        feature: Feature.Edit,
        name: 'Edit Track'
      })
    },
    onSettled: (_, __, { trackId }) => {
      // Always refetch after error or success to ensure cache is in sync with server
      // queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.track, trackId] })
    }
  })
}
