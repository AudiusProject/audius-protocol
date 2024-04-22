import React from 'react'

import BN from 'bn.js'
import clsx from 'clsx'

import DisplayAudio from 'components/DisplayAudio'
import Loading from 'components/Loading'
import Paper from 'components/Paper'
import { Status, Address } from 'types'
import { TICKER } from 'utils/consts'

import styles from './UserStakedStat.module.css'

const messages = {
  delegated: `DELEGATED`
}

type OwnProps = {
  className?: string
  wallet: Address
  totalDelegates: BN
  totalDelegatesStatus: Status
  isLoading?: boolean
}

type UserStakedStatProps = OwnProps

const UserStakedStat: React.FC<UserStakedStatProps> = (
  props: UserStakedStatProps
) => {
  return (
    <Paper className={clsx(styles.stakedContainer, props.className)}>
      {props.isLoading ? (
        <Loading />
      ) : (
        <>
          {props.totalDelegatesStatus !== Status.Success ? null : (
            <DisplayAudio
              className={styles.stakedAmount}
              amount={props.totalDelegates}
            />
          )}
          <div className={styles.label}>{TICKER}</div>
          <div className={styles.description}>{messages.delegated}</div>
        </>
      )}
    </Paper>
  )
}

export default UserStakedStat
