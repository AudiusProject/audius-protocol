import React from 'react'
import clsx from 'clsx'
import BN from 'bn.js'

import Tooltip, { Position } from 'components/Tooltip'
import styles from './StakingStat.module.css'
import { Status } from 'types'
import { TICKER } from 'utils/consts'
import { formatWei, formatShortAud } from 'utils/format'
import StatsChip, { Divider } from 'components/StatsChip/StatsChip'
import InlineStat from 'components/InlineStat/InlineStat'

const messages = {
  staked: `Staked ${TICKER}`,
  delegators: 'Delegators',
  services: 'Services',
  delegated: `${TICKER} Delegated`,
  discoveryNodes: 'Discovery Nodes',
  contentNodes: 'Content Nodes'
}

type OwnProps = {
  staked: BN
  numDiscoveryNodes: number
  numContentNodes: number
  totalDelegates: BN
  totalDelegatesStatus: Status
  isLoading: boolean
}

type StakingStatInfoProps = OwnProps

/**
 * Shows stats about staking. Lives on the SP page
 */
const StakingStatInfo: React.FC<StakingStatInfoProps> = ({
  totalDelegates,
  totalDelegatesStatus,
  staked,
  numContentNodes,
  numDiscoveryNodes,
  isLoading
}) => {
  const hasDelegates =
    totalDelegatesStatus === Status.Success && !totalDelegates.isZero()
  return (
    <StatsChip
      className={clsx({
        [styles.delegatesContainer]: hasDelegates
      })}
      tooltipText={formatWei(staked)}
      primaryStat={formatShortAud(staked)}
      primaryStatName={messages.staked}
      isLoading={isLoading}
    >
      <InlineStat
        label={messages.discoveryNodes}
        value={numDiscoveryNodes.toString()}
      />
      <InlineStat
        label={messages.contentNodes}
        value={numContentNodes.toString()}
      />
      {hasDelegates && (
        <>
          <Divider className={styles.delegatesDivider} />
          <div className={styles.delegatedContainer}>
            <div className={styles.delegatedLabel}>{messages.delegated}</div>
            <Tooltip
              position={Position.BOTTOM}
              text={formatWei(totalDelegates)}
              className={styles.delegatedValue}
            >
              {formatShortAud(totalDelegates)}
            </Tooltip>
          </div>
        </>
      )}
    </StatsChip>
  )
}

export default StakingStatInfo
