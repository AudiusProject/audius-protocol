import { Id } from '@audius/sdk'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models/Identifiers'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'
import { useCurrentUserId } from './useCurrentUserId'

export const useDownloadTrackStems = ({ trackId }: { trackId: ID }) => {
  const { audiusSdk } = useAudiusQueryContext()
  const queryClient = useQueryClient()
  const { data: currentUserId } = useCurrentUserId()

  return useMutation({
    mutationFn: async () => {
      const sdk = await audiusSdk()
      const archiver = sdk.services.archiverService
      if (!archiver) {
        throw new Error('Archiver service not configured')
      }
      if (!currentUserId) {
        throw new Error('Current user ID is required')
      }
      return await archiver.createStemsArchive({
        trackId: Id.parse(trackId),
        userId: Id.parse(currentUserId)
      })
    },
    onSuccess: async (response) => {
      queryClient.setQueryData(
        [QUERY_KEYS.downloadTrackStems, trackId],
        response
      )
      queryClient.setQueryData(
        [QUERY_KEYS.stemsArchiveJob, response.id],
        response
      )
    }
  })
}

export const useCancelStemsArchiveJob = () => {
  const { audiusSdk } = useAudiusQueryContext()
  return useMutation({
    mutationFn: async ({ jobId }: { jobId: string }) => {
      const sdk = await audiusSdk()
      const archiver = sdk.services.archiverService
      if (!archiver) {
        throw new Error('Archiver service not configured')
      }
      await archiver.cancelStemsArchiveJob({ jobId })
    }
  })
}

export const useGetStemsArchiveJobStatus = (
  { jobId }: { jobId?: string },
  options?: QueryOptions
) => {
  const { audiusSdk } = useAudiusQueryContext()

  return useQuery({
    queryKey: [QUERY_KEYS.stemsArchiveJob, jobId],
    queryFn: async () => {
      if (!jobId) {
        throw new Error('Job ID is required')
      }
      const sdk = await audiusSdk()
      const archiver = sdk.services.archiverService
      if (!archiver) {
        throw new Error('Archiver service not configured')
      }
      return await archiver.getStemsArchiveJobStatus({ jobId })
    },
    // refetch once per second until the job is completed or failed
    refetchInterval: (query) => {
      if (!query.state.data) {
        return 1000
      }
      if (['completed', 'failed'].includes(query.state.data.state)) {
        return false
      }
      return 1000
    },
    staleTime: 0,
    gcTime: 0,
    enabled: !!jobId,
    ...options
  })
}
