import React, { ReactNode } from 'react'

import DisplayAudio from 'components/DisplayAudio'
import Stat from 'components/Stat'
import useTotalStaked from 'hooks/useTotalStaked'
import { Status } from 'types'
import { TICKER } from 'utils/consts'

import styles from './TotalStakedStat.module.css'

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
