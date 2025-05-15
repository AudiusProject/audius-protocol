import { Id } from '@audius/sdk'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { useQueryContext } from '~/api/tan-query/utils/QueryContext'
import { useAppContext } from '~/context/appContext'
import { Kind } from '~/models'
import { Name, FollowSource } from '~/models/Analytics'
import { Feature } from '~/models/ErrorReporting'
import { ID } from '~/models/Identifiers'
import { AccountUserMetadata, UserMetadata } from '~/models/User'
import { update } from '~/store/cache/actions'
import { removeFolloweeId } from '~/store/gated-content/slice'
import { revokeFollowGatedAccess } from '~/store/tipping/slice'

import { getCurrentAccountQueryKey } from './account/useCurrentAccount'
import { useCurrentUserId } from './account/useCurrentUserId'
import { getUserQueryKey } from './useUser'

type UnfollowUserParams = {
  followeeUserId: ID | null | undefined
  source: FollowSource
}

type MutationContext = {
  previousUser: UserMetadata | undefined
  previousAccountUser: AccountUserMetadata | undefined
}

export const useUnfollowUser = () => {
  const { audiusSdk, reportToSentry } = useQueryContext()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()
  const {
    analytics: { track, make }
  } = useAppContext()
  const { data: currentUserId } = useCurrentUserId()

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

      dispatch(revokeFollowGatedAccess({ userId: followeeUserId }))

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
      if (!followeeUserId || !currentUserId) {
        return { previousUser: undefined, previousAccountUser: undefined }
      }

      await queryClient.cancelQueries({
        queryKey: getUserQueryKey(followeeUserId)
      })

      const previousUser = queryClient.getQueryData(
        getUserQueryKey(followeeUserId)
      )

      const followeeUpdate = {
        does_current_user_follow: false,
        follower_count: Math.max((previousUser?.follower_count ?? 0) - 1, 0)
      }
      if (previousUser) {
        const updatedUser = {
          ...previousUser,
          ...followeeUpdate
        }
        queryClient.setQueryData(getUserQueryKey(followeeUserId), updatedUser)
      }
      dispatch(update(Kind.USERS, [{ id: followeeUserId, metadata: update }]))

      const currentUser = queryClient.getQueryData(
        getUserQueryKey(currentUserId)
      )
      if (currentUser) {
        queryClient.setQueryData(getUserQueryKey(currentUserId), {
          ...currentUser,
          followee_count: Math.max((currentUser?.followee_count ?? 0) - 1, 0)
        })
      }

      const previousAccountUser = queryClient.getQueryData(
        getCurrentAccountQueryKey()
      )

      if (previousAccountUser) {
        queryClient.setQueryData(getCurrentAccountQueryKey(currentUserId), {
          ...previousAccountUser,
          user: {
            ...previousAccountUser.user,
            followee_count: Math.max(
              (previousAccountUser?.user?.followee_count ?? 0) - 1,
              0
            )
          }
        })
      }

      dispatch(
        update(Kind.USERS, [
          {
            id: currentUserId,
            metadata: {
              followee_count: Math.max(
                (previousAccountUser?.user?.followee_count ?? 0) - 1,
                0
              )
            }
          }
        ])
      )

      return { previousUser, previousAccountUser }
    },
    onError: (
      error,
      { followeeUserId },
      context: MutationContext | undefined
    ) => {
      const { previousUser } = context ?? {}

      if (previousUser) {
        queryClient.setQueryData(getUserQueryKey(followeeUserId), previousUser)
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
