import React, { ReactNode } from 'react'

import { TextProps } from '@audius/harmony'

import DisplayAudio from 'components/DisplayAudio'
import Stat from 'components/Stat'
import useTotalStaked from 'hooks/useTotalStaked'
import { Status } from 'types'

import styles from './TotalStakedStat.module.css'

type OwnProps = {}

type TotalStakedStatProps = OwnProps & TextProps

const TotalStakedStat: React.FC<TotalStakedStatProps> = (textProps) => {
  const { status, total } = useTotalStaked()
  let stat: ReactNode = null

  if (total && status === Status.Success) {
    stat = <DisplayAudio className={styles.stat} amount={total} />
  }

  return <Stat stat={stat} {...textProps} />
}

export default TotalStakedStat
