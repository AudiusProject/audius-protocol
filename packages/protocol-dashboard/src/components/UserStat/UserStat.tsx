import React from 'react'
import clsx from 'clsx'
import BN from 'bn.js'

import Paper from 'components/Paper'
import Tooltip, { Position } from 'components/Tooltip'
import styles from './UserStat.module.css'
import { Status } from 'types'
import { TICKER } from 'utils/consts'
import { formatWei, formatShortAud } from 'utils/format'

const messages = {
  staked: `Staked ${TICKER}`,
  deployerCut: 'Deployer Cut',
  delegators: 'Delegators',
  services: 'Services',
  delegated: `${TICKER} Delegated`
}

const Divider = ({ className }: { className?: string }) => {
  return (
    <div className={clsx(styles.divider, { [className!]: !!className })}></div>
  )
}

const Stat = ({
  className,
  label,
  value
}: {
  label: string
  value: string
  className?: string
}) => {
  return (
    <div className={clsx(styles.statContainer, { [className!]: !!className })}>
      <div className={styles.statLabel}>{label}</div>
      <div>{value}</div>
    </div>
  )
}
type OwnProps = {
  staked: BN
  deployerCut: number
  services: number
  delegators: number
  totalDelegates: BN
  totalDelegatesStatus: Status
}

type UserStatInfoProps = OwnProps

const UserStatInfo: React.FC<UserStatInfoProps> = (
  props: UserStatInfoProps
) => {
  const hasDelegates =
    props.totalDelegatesStatus === Status.Success &&
    !props.totalDelegates.isZero()
  return (
    <Paper
      className={clsx(styles.stakedContainer, {
        [styles.delegatesContainer]: hasDelegates
      })}
    >
      <Tooltip
        position={Position.TOP}
        text={formatWei(props.staked)}
        className={styles.stakedAmount}
      >
        {formatShortAud(props.staked)}
      </Tooltip>
      <div className={styles.stakedLabel}>{messages.staked}</div>
      <Divider className={clsx({ [styles.delegatesDivider]: hasDelegates })} />
      <Stat label={messages.deployerCut} value={`${props.deployerCut}%`} />
      <Stat label={messages.services} value={props.services.toString()} />
      <Stat
        label={messages.delegators}
        value={props.delegators.toString()}
        className={styles.lastStat}
      />
      {hasDelegates && (
        <>
          <Divider className={styles.delegatesDivider} />
          <div className={styles.delegatedContainer}>
            <div className={styles.delegatedLabel}>{messages.delegated}</div>
            <Tooltip
              position={Position.BOTTOM}
              text={formatWei(props.totalDelegates)}
              className={styles.delegatedValue}
            >
              {formatShortAud(props.totalDelegates)}
            </Tooltip>
          </div>
        </>
      )}
    </Paper>
  )
}

export default UserStatInfo
