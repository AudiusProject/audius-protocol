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
import { prepareTrackForUpload } from './utils/prepareTrackForUpload'

const { getCurrentUploads } = stemsUploadSelectors

type MutationContext = {
  previousTrack: Track | undefined
  processedMetadata: Partial<TrackMetadataForUpload>
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

      const encodedTrackId = Id.parse(trackId)
      const encodedUserId = Id.parse(userId)
      if (!encodedTrackId || !encodedUserId) throw new Error('Invalid ID')

      const previousMetadata = queryClient.getQueryData<Track>([
        QUERY_KEYS.track,
        trackId
      ])
      const processedMetadata = prepareTrackForUpload(metadata)
      const sdkMetadata = trackMetadataForUploadToSdk(
        processedMetadata as TrackMetadataForUpload
      )

      const response = await sdk.tracks.updateTrack({
        coverArtFile: coverArtFile
          ? fileToSdk(coverArtFile, 'cover_art')
          : undefined,
        trackId: encodedTrackId,
        userId: encodedUserId,
        metadata: sdkMetadata
      })

      // TODO: migrate stem uploads to use tan-query
      const inProgressStemUploads = getCurrentUploads(
        store.getState() as CommonState,
        trackId
      )
      if (previousMetadata) {
        handleStemUpdates(
          processedMetadata,
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

      const processedMetadata = prepareTrackForUpload(metadata)

      // Optimistically update track
      queryClient.setQueryData([QUERY_KEYS.track, trackId], (old: any) => ({
        ...old,
        ...processedMetadata
      }))

      // Optimistically update trackByPermalink
      queryClient.setQueryData(
        [QUERY_KEYS.trackByPermalink, metadata.permalink],
        (old: any) => ({
          ...old,
          ...processedMetadata
        })
      )

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
                    ...processedMetadata
                  }
                : track
            )
          }
        }
      )

      // Return context with the previous track and metadata
      return { previousTrack, processedMetadata }
    },
    onError: (error, { trackId, userId }, context?: MutationContext) => {
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
          metadata: context?.processedMetadata
        },
        feature: Feature.Edit,
        name: 'Edit Track'
      })
    },
    onSettled: (_, __, { trackId }) => {
      // Always refetch after error or success to ensure cache is in sync with server
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.track, trackId] })
    }
  })
}
