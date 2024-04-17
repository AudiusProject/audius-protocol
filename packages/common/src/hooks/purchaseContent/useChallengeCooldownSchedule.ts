import { useSelector } from 'react-redux'

import { ChallengeRewardID } from '~/models/AudioRewards'
import {
  UndisbursedUserChallenge,
  audioRewardsPageSelectors
} from '~/store/pages'
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
  const createdAt = utcToLocalTime(challenge.created_at)
  const cooldownDays = challenge.cooldown_days ?? 0
  const diff = now.diff(createdAt, 'day')
  const claimableDate = createdAt.add(cooldownDays, 'day')
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
    const createdAt = utcToLocalTime(c.created_at)
    const diff = now.diff(createdAt, 'day')
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
    .map((c) => ({ ...c, createdAtDate: dayjs.utc(c.created_at) }))

  // Challenges that are claimable now
  const claimableChallenges = challenges.filter(isCooldownChallengeClaimable)
  const claimableAmount = claimableChallenges.reduce(
    (acc, curr) => acc + curr.amount,
    0
  )

  // Challenges that are in still in cooldown period i.e. not yet claimable.
  // Challenges are already ordered by completed_blocknumber ascending.
  const cooldownChallenges = challenges.filter(
    (c) => !isCooldownChallengeClaimable(c)
  )
  const cooldownAmount = cooldownChallenges.reduce(
    (acc, curr) => acc + curr.amount,
    0
  )

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
