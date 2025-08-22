import { useEffect } from 'react'

import { useQuery } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { undisbursedUserChallengeFromSDK } from '~/adapters/challenge'
import { transformAndCleanList } from '~/adapters/utils'
import { useQueryContext } from '~/api/tan-query/utils'
import { Feature, ID } from '~/models'

export const getUndisbursedChallengesQueryKey = (
  userId?: ID | null,
  challengeId?: string | null
) => {
  return ['undisbursedChallenges', userId, challengeId]
}

export const useUndisbursedChallenges = (
  userId?: ID | null,
  challengeId?: string | null
) => {
  const { audiusSdk, reportToSentry } = useQueryContext()
  const dispatch = useDispatch()

  const queryRes = useQuery({
    queryKey: getUndisbursedChallengesQueryKey(userId, challengeId),
    queryFn: async () => {
      const sdk = await audiusSdk()
      const undisbursedRes = await sdk.challenges.getUndisbursedChallenges({
        ...(userId && { userId: userId.toString() }),
        ...(challengeId && { challengeId })
      })

      const undisbursedChallenges = transformAndCleanList(
        undisbursedRes.data,
        undisbursedUserChallengeFromSDK
      )
      return undisbursedChallenges
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
