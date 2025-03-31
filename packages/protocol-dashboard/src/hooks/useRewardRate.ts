import AudiusClient from 'services/Audius'
import { useFundsPerRound } from 'store/cache/claims/hooks'
import { Status } from 'types'

import useTotalStaked from './useTotalStaked'

export const useWeeklyRewardRate = () => {
  const fundsPerRound = useFundsPerRound()
  const totalActiveStake = useTotalStaked()
  if (
    fundsPerRound.status === Status.Success &&
    totalActiveStake.status === Status.Success
  ) {
    const percentage =
      AudiusClient.getBNPercentage(
        fundsPerRound.amount!,
        totalActiveStake.total!,
        4
      ) * 100
    return { status: Status.Success, rate: percentage }
  }
  return { status: Status.Loading }
}

export const useAnnualRewardRate = () => {
  const weeklyClaim = useWeeklyRewardRate()
  if (weeklyClaim.status === Status.Success) {
    const rate = weeklyClaim.rate! * 52
    return { status: Status.Success, rate }
  }
  return { status: Status.Loading }
}
