import { Id } from '@audius/sdk'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'

import { useAudiusQueryContext } from '~/audius-query/AudiusQueryContext'
import { useAppContext } from '~/context/appContext'
import { Kind } from '~/models'
import { Name, FollowSource } from '~/models/Analytics'
import { Feature } from '~/models/ErrorReporting'
import { ID } from '~/models/Identifiers'
import { Track, isContentFollowGated } from '~/models/Track'
import { UserMetadata } from '~/models/User'
import { add } from '~/store/cache/actions'
import { getTracks } from '~/store/cache/tracks/selectors'
import { CommonState } from '~/store/commonStore'
import { removeFolloweeId, revokeAccess } from '~/store/gated-content/slice'

import { QUERY_KEYS } from './queryKeys'
import { useCurrentUserId } from './useCurrentUserId'
import { getUserQueryKey } from './useUser'
import { getUserByHandleQueryKey } from './useUserByHandle'

type UnfollowUserParams = {
  followeeUserId: ID | null | undefined
  source: FollowSource
}

type MutationContext = {
  previousUser: UserMetadata | undefined
  previousAccountUser: UserMetadata | undefined
}

export const useUnfollowUser = () => {
  const { audiusSdk, reportToSentry } = useAudiusQueryContext()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()
  const {
    analytics: { track, make }
  } = useAppContext()
  const { data: currentUserId } = useCurrentUserId()
  const tracks = useSelector((state: CommonState) => getTracks(state, {}))

  return useMutation({
    mutationFn: async ({ followeeUserId, source }: UnfollowUserParams) => {
      if (!currentUserId || !followeeUserId) {
        return
      }

      const sdk = await audiusSdk()
      await sdk.users.unfollowUser({
        userId: Id.parse(currentUserId),
        followeeUserId: Id.parse(followeeUserId)
      })

      // Handle gated content
      dispatch(removeFolloweeId({ id: followeeUserId }))

      // Revoke access to follow-gated tracks
      if (tracks) {
        const revokeAccessMap: { [id: ID]: 'stream' | 'download' } = {}
        Object.values(tracks).forEach((track: Track) => {
          const isStreamFollowGated =
            track.stream_conditions &&
            isContentFollowGated(track.stream_conditions)
          const isDownloadFollowGated =
            track.download_conditions &&
            isContentFollowGated(track.download_conditions)

          if (isStreamFollowGated && track.owner_id === followeeUserId) {
            revokeAccessMap[track.track_id] = 'stream'
          } else if (
            isDownloadFollowGated &&
            track.owner_id === followeeUserId
          ) {
            revokeAccessMap[track.track_id] = 'download'
          }
        })

        if (Object.keys(revokeAccessMap).length > 0) {
          dispatch(revokeAccess({ revokeAccessMap }))
        }
      }

      // Track the unfollow
      if (source) {
        track(
          make({
            eventName: Name.UNFOLLOW,
            id: followeeUserId.toString(),
            source
          })
        )
      }
    },
    onMutate: async ({ followeeUserId }) => {
      if (!followeeUserId) {
        return { previousUser: undefined, previousAccountUser: undefined }
      }

      await queryClient.cancelQueries({
        queryKey: [QUERY_KEYS.user, followeeUserId]
      })

      const previousUser = queryClient.getQueryData<UserMetadata>([
        QUERY_KEYS.user,
        followeeUserId
      ])

      if (previousUser) {
        const updatedUser = {
          ...previousUser,
          does_current_user_follow: false,
          follower_count: previousUser.follower_count - 1
        }
        queryClient.setQueryData(getUserQueryKey(followeeUserId), updatedUser)
        if (previousUser.handle) {
          queryClient.setQueryData(
            getUserByHandleQueryKey(previousUser.handle),
            updatedUser
          )
        }
        dispatch(
          add(Kind.USERS, [{ id: followeeUserId, metadata: updatedUser }], true)
        )
      }

      const previousAccountUser = queryClient.getQueryData<UserMetadata>([
        QUERY_KEYS.accountUser
      ])

      if (previousAccountUser) {
        queryClient.setQueryData([QUERY_KEYS.accountUser], {
          ...previousAccountUser,
          followee_count: previousAccountUser.followee_count - 1
        })
      }

      return { previousUser, previousAccountUser }
    },
    onError: (
      error,
      { followeeUserId },
      context: MutationContext | undefined
    ) => {
      const { previousUser, previousAccountUser } = context ?? {}

      if (previousUser) {
        queryClient.setQueryData(getUserQueryKey(followeeUserId), previousUser)

        if (previousUser.handle) {
          queryClient.setQueryData(
            getUserByHandleQueryKey(previousUser.handle),
            previousUser
          )
        }
      }

      if (previousAccountUser) {
        queryClient.setQueryData([QUERY_KEYS.accountUser], previousAccountUser)
      }

      reportToSentry({
        error,
        additionalInfo: {
          followeeUserId
        },
        feature: Feature.Social,
        name: 'Unfollow User'
      })
    }
  })
}
