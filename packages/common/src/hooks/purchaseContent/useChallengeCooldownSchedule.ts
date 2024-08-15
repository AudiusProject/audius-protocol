import { partition, sum } from 'lodash'
import { useSelector } from 'react-redux'

import {
  ChallengeRewardID,
  UndisbursedUserChallenge
} from '~/models/AudioRewards'
import { audioRewardsPageSelectors } from '~/store/pages'
import { isCooldownChallengeClaimable } from '~/utils/challenges'
import dayjs, { Dayjs } from '~/utils/dayjs'
import { utcToLocalTime } from '~/utils/timeUtil'

const { getUndisbursedUserChallenges } = audioRewardsPageSelectors

const messages = {
  laterToday: 'Later Today',
  tomorrow: 'Tomorrow',
  readyToClaim: 'Ready to claim!'
}

const getCooldownChallengeInfo = (
  challenge: UndisbursedUserChallenge,
  now: Dayjs
) => {
  const completedAt = utcToLocalTime(challenge.completed_at)
  const cooldownDays = challenge.cooldown_days ?? 0
  const diff = now.diff(completedAt, 'day')
  const claimableDate = completedAt.add(cooldownDays, 'day')
  const isClose = cooldownDays - diff <= 1
  let label = claimableDate.format('dddd')
  if (diff === cooldownDays) {
    label = messages.laterToday
  } else if (diff === cooldownDays - 1) {
    label = messages.tomorrow
  }
  return {
    label,
    claimableDate,
    isClose
  }
}

export const formatCooldownChallenges = (
  challenges: UndisbursedUserChallenge[]
) => {
  if (challenges.length === 0) return []
  const now = dayjs().endOf('day')
  const cooldownChallenges = new Array(challenges[0].cooldown_days)
  challenges.forEach((c) => {
    const completedAt = utcToLocalTime(c.completed_at)
    const diff = now.diff(completedAt, 'day')
    cooldownChallenges[diff] = {
      ...cooldownChallenges[diff],
      id: c.specifier,
      value: (cooldownChallenges[diff]?.value ?? 0) + c.amount,
      ...getCooldownChallengeInfo(c, now)
    }
  })
  return cooldownChallenges
}

const TRENDING_CHALLENGE_IDS = new Set(['tt', 'tut', 'tp'])
/**
 * Returns a list of challenges in cooldown period (not claimable yet), and
 * the total currently claimable amount (for challenges past the cooldown period).
 */
export const useChallengeCooldownSchedule = ({
  challengeId,
  multiple
}: {
  challengeId?: ChallengeRewardID
  multiple?: boolean
}) => {
  const challenges = useSelector(getUndisbursedUserChallenges)
    .filter((c) => multiple || c.challenge_id === challengeId)
    .filter((c) => !TRENDING_CHALLENGE_IDS.has(c.challenge_id))

  const [claimableChallenges, cooldownChallenges] = partition(
    challenges,
    isCooldownChallengeClaimable
  )
  const claimableAmount = sum(claimableChallenges.map((c) => c.amount))
  const cooldownAmount = sum(cooldownChallenges.map((c) => c.amount))

  // Summary for claimable amount if any
  const summary =
    claimableAmount > 0
      ? {
          id: messages.readyToClaim,
          label: messages.readyToClaim,
          value: claimableAmount
        }
      : undefined

  const isEmpty = claimableAmount + cooldownAmount === 0

  return {
    claimableChallenges,
    claimableAmount,
    cooldownChallenges,
    cooldownAmount,
    summary,
    isEmpty
  }
}
