import React from 'react'

import RewardStat from 'components/RewardStat'
import { useAnnualRewardRate } from 'hooks/useRewardRate'
import { Status } from 'types'

const messages = {
  label: 'Annual'
}

interface EstimatedAnnualStatProps {
  className?: string
}

const EstimatedAnnualStat: React.FC<EstimatedAnnualStatProps> = ({
  className
}) => {
  const claimRate = useAnnualRewardRate()
  const value =
    claimRate.status === Status.Success
      ? `${claimRate.rate!.toFixed(0)}%`
      : null
  return <RewardStat label={messages.label} stat={value} />
}

export default EstimatedAnnualStat
