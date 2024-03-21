import React, { ReactNode } from 'react'

import Stat from 'components/Stat'
import { TextProps } from '@audius/harmony'
import styles from './TotalStakedStat.module.css'
import { Status } from 'types'
import useTotalStaked from 'hooks/useTotalStaked'
import DisplayAudio from 'components/DisplayAudio'

type OwnProps = {}

type TotalStakedStatProps = OwnProps & TextProps

const TotalStakedStat: React.FC<TotalStakedStatProps> = textProps => {
  const { status, total } = useTotalStaked()
  let stat: ReactNode = null

  if (total && status === Status.Success) {
    stat = <DisplayAudio className={styles.stat} amount={total} />
  }

  return <Stat stat={stat} {...textProps} />
}

export default TotalStakedStat
