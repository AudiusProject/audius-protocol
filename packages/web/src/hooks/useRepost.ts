import { useCallback } from 'react'

import {
  useRepostTrack as useRepostTrackQuery,
  getTrackQueryKey
} from '@audius/common/api'
import {
  Name,
  Kind,
  RepostSource,
  ID,
  UserTrackMetadata
} from '@audius/common/models'
import { accountSelectors } from '@audius/common/store'
import { useQueryClient } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'

import { make } from 'common/store/analytics/actions'
import {
  showRequiresAccountToast,
  openSignOn
} from 'common/store/pages/signon/actions'
const { getIsGuestAccount } = accountSelectors

/**
 * Wraps the useRepostTrack method from our tan-query hooks but adds some biz logic for guest mode & handles analytics tracking
 * @param trackId - The ID of the track to repost
 * @returns A callback function that reposts the track
 */
export const useRepostTrack = () => {
  const isGuest = useSelector(getIsGuestAccount)
  const dispatch = useDispatch()
  const { mutate: repostTrack } = useRepostTrackQuery()
  const queryClient = useQueryClient()

  return useCallback(
    ({ trackId }: { trackId: ID }) => {
      if (isGuest) {
        dispatch(openSignOn(false))
        dispatch(showRequiresAccountToast())
        make(Name.CREATE_ACCOUNT_OPEN, { source: 'social action' })
      } else {
        repostTrack({ trackId })
        // Note: not able do useTrack here since the trackId is provided at callback time.
        // Instead just check what the value was at the time of the method call.
        const track = queryClient.getQueryData<UserTrackMetadata>(
          getTrackQueryKey(trackId)
        )
        if (!track?.has_current_user_reposted) {
          dispatch(
            make(Name.REPOST, {
              kind: Kind.TRACKS,
              source: RepostSource.TILE,
              id: trackId
            })
          )
        }
      }
    },
    [isGuest, dispatch, repostTrack, queryClient]
  )
}

// TODO: Implement repost collection here
