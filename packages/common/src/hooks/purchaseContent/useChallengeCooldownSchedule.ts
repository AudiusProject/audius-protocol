import { useSelector } from 'react-redux'

import { ChallengeRewardID } from 'models/AudioRewards'
import {
  UndisbursedUserChallenge,
  audioRewardsPageSelectors
} from 'store/pages'
import { isCooldownChallengeClaimable } from 'utils/challenges'
import dayjs, { Dayjs } from 'utils/dayjs'
import { utcToLocalTime } from 'utils/timeUtil'

const { getUndisbursedUserChallenges } = audioRewardsPageSelectors

const messages = {
  laterToday: 'Later Today',
  readyToClaim: 'Ready to Claim!',
  tomorrow: 'Tomorrow'
}

/**
 * Returns a list of challenges in cooldown period (not claimable yet), and
 * the total currently claimable amount (for challenges past the cooldown period).
 */
export const useChallengeCooldownSchedule = (
  challengeId?: ChallengeRewardID
) => {
  const challenges = useSelector(getUndisbursedUserChallenges)
    .filter((c) => c.challenge_id === challengeId)
    .map((c) => ({ ...c, createdAtDate: dayjs.utc(c.created_at) }))
  // Only challenges past the cooldown period are claimable
  // Challenges are already ordered by completed_blocknumber ascending.
  const cooldownChallenges = challenges.filter(
    (c) => !isCooldownChallengeClaimable(c)
  )
  const claimableAmount = challenges
    .filter(isCooldownChallengeClaimable)
    .reduce((acc, curr) => acc + curr.amount, 0)
  return { cooldownChallenges, claimableAmount }
}

const getAudioMatchingCooldownLabel = (
  challenge: UndisbursedUserChallenge,
  now: Dayjs
) => {
  const createdAt = utcToLocalTime(challenge.created_at)
  const cooldownDays = challenge.cooldown_days ?? 0
  const diff = now.diff(createdAt, 'day')
  if (diff === cooldownDays) {
    return messages.laterToday
  } else if (diff === cooldownDays - 1) {
    return messages.tomorrow
  }
  return createdAt.add(cooldownDays, 'day').format('ddd (M/D)')
}

const formatAudioMatchingChallengesForCooldownSchedule = (
  challenges: UndisbursedUserChallenge[]
) => {
  if (challenges.length === 0) return []
  const now = dayjs().endOf('day')
  const cooldownChallenges = new Array(challenges[0].cooldown_days)
  challenges.forEach((c) => {
    const createdAt = utcToLocalTime(c.created_at)
    const diff = now.diff(createdAt, 'day')
    cooldownChallenges[diff] = {
      ...cooldownChallenges[diff],
      id: c.specifier,
      label: getAudioMatchingCooldownLabel(c, now),
      value: (cooldownChallenges[diff]?.value ?? 0) + c.amount
    }
  })
  return cooldownChallenges
}

const getAudioMatchingChallengeCooldownSummary = (claimableAmount: number) => ({
  id: messages.readyToClaim,
  label: messages.readyToClaim,
  value: claimableAmount
})

/**
 * Custom hook using values specific to $AUDIO matching challenges.
 */
export const useAudioMatchingChallengeCooldownSchedule = (
  challengeId?: ChallengeRewardID
) => {
  const { cooldownChallenges, claimableAmount } =
    useChallengeCooldownSchedule(challengeId)
  return {
    claimableAmount,
    cooldownChallenges:
      formatAudioMatchingChallengesForCooldownSchedule(cooldownChallenges),
    cooldownChallengesSummary:
      claimableAmount > 0
        ? getAudioMatchingChallengeCooldownSummary(claimableAmount)
        : undefined,
    isEmpty:
      cooldownChallenges.every((c) => c === undefined) && claimableAmount === 0
  }
}
