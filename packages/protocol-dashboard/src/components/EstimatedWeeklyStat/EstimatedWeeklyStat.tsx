import React from 'react'

import { TextProps } from '@audius/harmony'

import RewardStat from 'components/RewardStat'
import { useWeeklyRewardRate } from 'hooks/useRewardRate'
import { Status } from 'types'

interface EstimatedWeeklyStatProps extends TextProps {
  className?: string
}

const messages = {
  weekly: 'Weekly'
}

const EstimatedWeeklyStat: React.FC<EstimatedWeeklyStatProps> = ({
  className,
  ...textProps
}) => {
  const claimRate = useWeeklyRewardRate()
  const value =
    claimRate.status === Status.Success
      ? `${claimRate.rate!.toFixed(3)}%`
      : null
  return (
    <RewardStat label={messages.weekly} className={className} stat={value} />
  )
}

export default EstimatedWeeklyStat
