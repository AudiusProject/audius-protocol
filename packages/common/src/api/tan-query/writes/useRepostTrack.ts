import { Id } from '@audius/sdk'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { getTrackQueryKey, useCurrentUserId } from '~/api'
import { useAudiusQueryContext } from '~/audius-query'
import { UserTrackMetadata } from '~/models'
import { ID } from '~/models/Identifiers'

import { primeTrackData } from '../utils/primeTrackData'

export const useRepostTrack = () => {
  const { audiusSdk } = useAudiusQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()
  return useMutation({
    mutationFn: async ({ trackId }: { trackId: ID }) => {
      if (!trackId || trackId <= 0) {
        return
      }
      if (!currentUserId) {
        throw new Error('Missing required data')
      }
      const sdk = await audiusSdk()
      sdk.tracks.repostTrack({
        trackId: Id.parse(trackId),
        userId: Id.parse(currentUserId)
      })
    },

    onMutate: ({ trackId }) => {
      const prevTrack = queryClient.getQueryData<UserTrackMetadata>(
        getTrackQueryKey(trackId)
      ) as UserTrackMetadata
      const isRepost = !prevTrack?.has_current_user_reposted // repost vs un repost

      const updatedTrack = {
        ...prevTrack,
        repost_count: (prevTrack?.repost_count ?? 0) + (isRepost ? 1 : -1),
        has_current_user_reposted: isRepost
      }
      primeTrackData({
        tracks: [updatedTrack],
        queryClient,
        dispatch,
        forceReplace: true
      })
      queryClient.setQueryData(getTrackQueryKey(trackId), updatedTrack)
      return { prevTrack }
    },
    onError: (_error, { trackId }, context) => {
      const { prevTrack } = context ?? {}
      if (!prevTrack) {
        return
      }
      queryClient.setQueryData(getTrackQueryKey(trackId), prevTrack)
      primeTrackData({
        tracks: [prevTrack],
        queryClient,
        dispatch,
        forceReplace: true
      })
    }
  })
}
