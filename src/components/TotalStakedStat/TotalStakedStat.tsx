import React, { ReactNode } from 'react'

import Stat from '../../components/Stat'
import { TICKER } from '../../utils/consts'
import styles from './TotalStakedStat.module.css'
import { Status } from '../../types'
import useTotalStaked from '../../hooks/useTotalStaked'
import DisplayAudio from '../../components/DisplayAudio'

const messages = {
  staked: `Active Stake ${TICKER}`
}

type OwnProps = {}

type TotalStakedStatProps = OwnProps

const TotalStakedStat: React.FC<TotalStakedStatProps> = () => {
  const { status, total } = useTotalStaked()
  let stat: ReactNode = null

  if (total && status === Status.Success) {
    stat = <DisplayAudio className={styles.stat} amount={total} shortFormat />
  }

  return <Stat label={messages.staked} stat={stat} />
}

export default TotalStakedStat
