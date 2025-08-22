import { useEffect } from 'react'

import { Id } from '@audius/sdk'
import { useQuery } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { userChallengeFromSDK } from '~/adapters/challenge'
import { transformAndCleanList } from '~/adapters/utils'
import { useQueryContext } from '~/api/tan-query/utils'
import { Feature, ID } from '~/models'
import { isPlayCountChallenge } from '~/utils/challenges'

export const getUserChallengesQueryKey = (userId: ID | null | undefined) => {
  return ['userChallenges', userId]
}

export const useUserChallenges = (userId: ID | null | undefined) => {
  const { audiusSdk, reportToSentry } = useQueryContext()
  const dispatch = useDispatch()

  const queryRes = useQuery({
    queryKey: getUserChallengesQueryKey(userId),
    enabled: !!userId,
    queryFn: async () => {
      const sdk = await audiusSdk()

      // Fetch user challenges
      const challengesRes = await sdk.users.getUserChallenges({
        id: Id.parse(userId).toString()
      })

      // Fetch monthly play counts from 2025
      const { data: monthlyPlays = {} } =
        await sdk.users.getUserMonthlyTrackListens({
          id: Id.parse(userId).toString(),
          startTime: '2025-01-01',
          // Making the end time one year from the current date since the challenge is technically never ending
          endTime: new Date(
            new Date().setFullYear(new Date().getFullYear() + 1)
          )
            .toISOString()
            .split('T')[0]
        })

      const totalPlaysOnOwnedTracks = Object.values(monthlyPlays).reduce(
        (sum, month) => sum + (month.totalListens || 0),
        0
      )

      let userChallenges = transformAndCleanList(
        challengesRes.data,
        userChallengeFromSDK
      )

      // Only update play count milestone challenges if they exist and there are plays
      if (
        userChallenges.some((challenge) =>
          isPlayCountChallenge(challenge.challenge_id)
        )
      ) {
        userChallenges = userChallenges.map((challenge) => {
          if (isPlayCountChallenge(challenge.challenge_id)) {
            return {
              ...challenge,
              current_step_count: Math.max(
                challenge.current_step_count,
                totalPlaysOnOwnedTracks
              )
            }
          }
          return challenge
        })
      }

      return userChallenges
    },
    staleTime: Infinity
  })

  const { error } = queryRes

  useEffect(() => {
    if (error) {
      reportToSentry({
        error,
        name: 'Challenges',
        feature: Feature.Comments
      })
    }
  }, [error, dispatch, reportToSentry])

  return queryRes
}
