import React from 'react'

import { IconCheck, IconRemove } from '@audius/stems'
import clsx from 'clsx'

import Loading from 'components/Loading'
import { Outcome } from 'types'

import styles from './ProposalStatusChip.module.css'

const messages = {
  [Outcome.Rejected]: 'Rejected',
  [Outcome.ApprovedExecuted]: 'Executed',
  [Outcome.QuorumNotMet]: 'Quorum Not Met',
  [Outcome.ApprovedExecutionFailed]: 'Approved Execution Failed',
  [Outcome.Evaluating]: 'Pending Execution', // This is an internal state that will not ever be set
  [Outcome.InProgress]: 'In Progress', // Chip should not be shown for inProgress
  [Outcome.InProgressExecutionDelay]: 'Execution Cooldown',
  [Outcome.InProgressAwaitingExecution]: 'Proposal Can Be Executed',
  [Outcome.Vetoed]: 'Vetoed',
  [Outcome.TargetContractAddressChanged]: 'Target Contract Address Changed',
  [Outcome.TargetContractCodeHashChanged]: 'Target Contract Code Hash Changed'
}

const Pending = ({ className }: { className?: string }) => (
  <div className={clsx(styles.loadingSpinner, { [className!]: !!className })}>
    <Loading />
  </div>
)

const outcomeMapping = {
  [Outcome.Rejected]: {
    text: messages[Outcome.Rejected],
    style: styles.failed,
    icon: IconRemove
  },
  [Outcome.ApprovedExecuted]: {
    text: messages[Outcome.ApprovedExecuted],
    style: styles.executed,
    icon: IconCheck
  },
  [Outcome.QuorumNotMet]: {
    text: messages[Outcome.QuorumNotMet],
    style: styles.failed,
    icon: IconRemove
  },
  [Outcome.ApprovedExecutionFailed]: {
    text: messages[Outcome.ApprovedExecutionFailed],
    style: styles.failed,
    icon: IconRemove
  },
  [Outcome.Evaluating]: {
    text: messages[Outcome.Evaluating],
    style: styles.pending,
    icon: Pending
  },
  [Outcome.InProgress]: {
    text: messages[Outcome.InProgress],
    style: styles.pending,
    icon: Pending
  },
  [Outcome.InProgressExecutionDelay]: {
    text: messages[Outcome.InProgressExecutionDelay],
    style: styles.pending,
    icon: Pending
  },
  [Outcome.InProgressAwaitingExecution]: {
    text: messages[Outcome.InProgressAwaitingExecution],
    style: styles.pending,
    icon: Pending
  },
  [Outcome.Vetoed]: {
    text: messages[Outcome.Vetoed],
    style: styles.failed,
    icon: IconRemove
  },
  [Outcome.TargetContractAddressChanged]: {
    text: messages[Outcome.TargetContractAddressChanged],
    style: styles.failed,
    icon: IconRemove
  },
  [Outcome.TargetContractCodeHashChanged]: {
    text: messages[Outcome.TargetContractCodeHashChanged],
    style: styles.failed,
    icon: IconRemove
  }
}

type OwnProps = {
  outcome: Outcome
}

type ProposalStatusChipProps = OwnProps

const ProposalStatusChip: React.FC<ProposalStatusChipProps> = ({ outcome }) => {
  const { text, icon: Icon, style } = outcomeMapping[outcome]
  return (
    <div className={clsx(styles.chip, style)}>
      <div className={styles.text}>{text}</div>
      <div className={styles.circle}>
        <Icon className={styles.icon} />
      </div>
    </div>
  )
}

export default ProposalStatusChip
