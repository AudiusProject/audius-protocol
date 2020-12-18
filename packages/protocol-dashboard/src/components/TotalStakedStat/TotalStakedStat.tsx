import React from 'react'
import BN from 'bn.js'

import { formatShortAud } from 'utils/format'
import Stat from 'components/Stat'
import { useUsers } from 'store/cache/user/hooks'
import { TICKER } from 'utils/consts'
import Tooltip from 'components/Tooltip'
import { formatWei } from 'utils/format'
import getActiveStake from 'utils/activeStake'
import styles from './TotalStakedStat.module.css'

const messages = {
  staked: `Active Stake ${TICKER}`
}

type OwnProps = {}

type TotalStakedStatProps = OwnProps

const TotalStakedStat: React.FC<TotalStakedStatProps> = () => {
  const { users } = useUsers()

  const totalVotingPowerStake = users?.reduce((total, user) => {
    const activeStake = getActiveStake(user)
    return total.add(activeStake)
  }, new BN('0'))

  const stat = !totalVotingPowerStake.isZero() ? (
    <Tooltip className={styles.stat} text={formatWei(totalVotingPowerStake)}>
      {formatShortAud(totalVotingPowerStake)}
    </Tooltip>
  ) : null
  return <Stat label={messages.staked} stat={stat} />
}

export default TotalStakedStat
