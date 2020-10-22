import React from 'react'

import { formatShortAud } from 'utils/format'
import Stat from 'components/Stat'
import { useTotalStaked } from 'store/cache/protocol/hooks'
import { TICKER } from 'utils/consts'
import Tooltip from 'components/Tooltip'
import { formatWei } from 'utils/format'
import styles from './TotalStakedStat.module.css'

const messages = {
  staked: `Total Staked ${TICKER}`
}

type OwnProps = {}

type TotalStakedStatProps = OwnProps

const TotalStakedStat: React.FC<TotalStakedStatProps> = () => {
  const totalStaked = useTotalStaked()
  const stat = totalStaked ? (
    <Tooltip className={styles.stat} text={formatWei(totalStaked)}>
      {formatShortAud(totalStaked)}
    </Tooltip>
  ) : null
  return <Stat label={messages.staked} stat={stat} />
}

export default TotalStakedStat
