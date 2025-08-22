import { useMemo } from 'react'

import {
  ChallengeRewardID,
  OptimisticUserChallenge,
  UndisbursedUserChallenge,
  UserChallenge,
  UserChallengeState,
  ID
} from '~/models'
import { isCooldownChallengeClaimable, removeNullable } from '~/utils'

import { useUndisbursedChallenges } from './useUndisbursedChallenges'
import { useUserChallenges } from './useUserChallenges'

// Helper function to get the state of a user challenge
const getUserChallengeState = (
  challenge: UserChallenge
): UserChallengeState => {
  if (challenge.is_disbursed) {
    return 'disbursed'
  }
  if (
    challenge.is_complete ||
    (challenge.max_steps !== null &&
      challenge.current_step_count >= challenge.max_steps)
  ) {
    return 'completed'
  }
  if (challenge.current_step_count > 0) {
    return 'in_progress'
  }
  if (challenge.is_active) {
    return 'incomplete'
  }
  return 'inactive'
}

// Helper function to convert a user challenge to an optimistic user challenge
const toOptimisticChallenge = (
  challenge: UserChallenge,
  undisbursed: UndisbursedUserChallenge[]
): OptimisticUserChallenge => {
  const state = getUserChallengeState(challenge)

  // For aggregate challenges, we show the total amount
  // you'd get when completing every step of the challenge
  const totalAmount =
    challenge.challenge_type === 'aggregate' && challenge.max_steps !== null
      ? challenge.amount * challenge.max_steps
      : challenge.amount

  let claimableAmount = 0
  const undisbursedSpecifiers = undisbursed.map((u) => ({
    specifier: u.specifier,
    amount: u.amount
  }))

  if (challenge.cooldown_days > 0) {
    // For cooldown challenges, calculate claimable amount from undisbursed challenges
    claimableAmount = undisbursed
      .filter(isCooldownChallengeClaimable)
      .reduce((sum, u) => sum + u.amount, 0)
  } else if (challenge.is_complete && !challenge.is_disbursed) {
    claimableAmount = challenge.amount
  }

  return {
    ...challenge,
    __isOptimistic: true,
    state,
    totalAmount,
    claimableAmount,
    undisbursedSpecifiers
  }
}

/**
 * Hook that provides optimistic user challenges with proper state calculation,
 * claimable amounts, and undisbursed challenge data.
 *
 * @param userId - The user ID to fetch challenges for
 * @returns Object containing optimistic challenges data and loading states
 */
export const useOptimisticChallenges = (userId: ID | null | undefined) => {
  const { data: userChallengesArray = [], isLoading: userChallengesLoading } =
    useUserChallenges(userId)

  const {
    data: undisbursedChallengesArray = [],
    isLoading: undisbursedLoading
  } = useUndisbursedChallenges(userId)

  // Create optimistic challenges using hooks data
  const optimisticUserChallenges = useMemo(() => {
    if (!userChallengesArray || !undisbursedChallengesArray) return {}

    // Group undisbursed challenges by challenge_id
    const undisbursedByChallenge = undisbursedChallengesArray.reduce<
      Partial<Record<ChallengeRewardID, UndisbursedUserChallenge[]>>
    >((acc, challenge) => {
      if (!acc[challenge.challenge_id]) {
        acc[challenge.challenge_id] = []
      }
      acc[challenge.challenge_id]!.push(challenge)
      return acc
    }, {})

    // Convert to optimistic challenges
    return userChallengesArray
      .filter(removeNullable)
      .map((challenge) =>
        toOptimisticChallenge(
          challenge,
          undisbursedByChallenge[challenge.challenge_id] || []
        )
      )
      .reduce(
        (map, challenge) => {
          map[challenge.challenge_id] = challenge
          return map
        },
        {} as Partial<Record<ChallengeRewardID, OptimisticUserChallenge>>
      )
  }, [userChallengesArray, undisbursedChallengesArray])

  // Create basic user challenges map (non-optimistic)
  const userChallenges = useMemo(() => {
    if (!userChallengesArray) return {}
    return userChallengesArray.reduce(
      (acc: Record<string, UserChallenge>, challenge: UserChallenge) => ({
        ...acc,
        [challenge.challenge_id]: challenge
      }),
      {}
    )
  }, [userChallengesArray])

  return {
    optimisticUserChallenges,
    userChallenges,
    userChallengesArray,
    undisbursedChallengesArray,
    isLoading: userChallengesLoading || undisbursedLoading,
    userChallengesLoading,
    undisbursedLoading
  }
}
