import React, { ReactNode } from 'react'

import { formatShortAud } from 'utils/format'
import Stat from 'components/Stat'
import { TICKER } from 'utils/consts'
import Tooltip from 'components/Tooltip'
import { formatWei } from 'utils/format'
import styles from './TotalStakedStat.module.css'
import { Status } from 'types'
import useTotalStaked from 'hooks/useTotalStaked'

const messages = {
  staked: `Active Stake ${TICKER}`
}

type OwnProps = {}

type TotalStakedStatProps = OwnProps

const TotalStakedStat: React.FC<TotalStakedStatProps> = () => {
  const { status, total } = useTotalStaked()
  let stat: ReactNode = null

  if (total && status === Status.Success) {
    stat = (
      <Tooltip className={styles.stat} text={formatWei(total)}>
        {formatShortAud(total)}
      </Tooltip>
    )
  }

  return <Stat label={messages.staked} stat={stat} />
}

export default TotalStakedStat
