import { useSelector } from 'react-redux'

import { ChallengeRewardID } from 'models/AudioRewards'
import {
  UndisbursedUserChallenge,
  audioRewardsPageSelectors
} from 'store/pages'
import dayjs, { Dayjs } from 'utils/dayjs'

import { COOLDOWN_DAYS } from './constants'

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
  const now = dayjs.utc()
  // Only challenges past the cooldown period are claimable
  const claimableAmount = challenges
    .filter((c) => now.diff(c.createdAtDate, 'day') >= COOLDOWN_DAYS)
    .reduce((acc, curr) => acc + curr.amount, 0)
  // Challenges are already ordered by completed_blocknumber ascending.
  const cooldownChallenges = challenges.filter(
    (c) => now.diff(c.createdAtDate, 'day') < COOLDOWN_DAYS
  )
  return { claimableAmount, cooldownChallenges }
}

const getAudioMatchingCooldownLabel = (now: Dayjs, created_at: Dayjs) => {
  const diff = now.diff(created_at, 'day')
  if (diff === COOLDOWN_DAYS) {
    return messages.laterToday
  } else if (diff === COOLDOWN_DAYS - 1) {
    return messages.tomorrow
  }
  return created_at.local().add(COOLDOWN_DAYS, 'day').format('ddd (M/D)')
}

const formatAudioMatchingChallengeCooldownSchedule = (
  challenges: UndisbursedUserChallenge[]
) => {
  const now = dayjs.utc().endOf('day')
  const cooldownChallenges = new Array(7)
  challenges.forEach((c) => {
    const createdAtUTC = dayjs.utc(c.created_at)
    const diff = now.diff(createdAtUTC, 'day')
    cooldownChallenges[diff] = {
      ...cooldownChallenges[diff],
      id: c.specifier,
      label: getAudioMatchingCooldownLabel(now, createdAtUTC),
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
      formatAudioMatchingChallengeCooldownSchedule(cooldownChallenges),
    cooldownChallengesSummary:
      claimableAmount > 0
        ? getAudioMatchingChallengeCooldownSummary(claimableAmount)
        : undefined,
    isEmpty:
      cooldownChallenges.every((c) => c === undefined) && claimableAmount === 0
  }
}
