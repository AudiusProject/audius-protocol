import React from 'react'
import BN from 'bn.js'

import Paper from 'components/Paper'
import Tooltip, { Position } from 'components/Tooltip'
import styles from './UserStakedStat.module.css'
import { Status } from 'types'
import { TICKER } from 'utils/consts'
import { Address } from 'types'
import { formatWei, formatShortAud } from 'utils/format'

const messages = {
  delegated: `DELEGATED`
}

type OwnProps = {
  wallet: Address
  totalDelegates: BN
  totalDelegatesStatus: Status
}

type UserStakedStatProps = OwnProps

const UserStakedStat: React.FC<UserStakedStatProps> = (
  props: UserStakedStatProps
) => {
  return (
    <Paper className={styles.stakedContainer}>
      {props.totalDelegatesStatus !== Status.Success ? null : (
        <Tooltip
          position={Position.TOP}
          text={formatWei(props.totalDelegates)}
          className={styles.stakedAmount}
        >
          {formatShortAud(props.totalDelegates)}
        </Tooltip>
      )}
      <div className={styles.label}>{TICKER}</div>
      <div className={styles.description}>{messages.delegated}</div>
    </Paper>
  )
}

export default UserStakedStat
