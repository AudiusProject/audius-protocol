import React from 'react'

import clsx from 'clsx'

import { Outcome } from 'types'

import styles from './ProposalStatusBadge.module.css'

const messages = {
  open: 'open',
  executionPending: 'executing',
  cooldown: 'cooldown',
  ready: 'awaiting execution',
  passed: 'passed',
  failed: 'failed'
}

const outcomeMapping = {
  [Outcome.InProgress]: { text: messages.open, style: styles.open },
  [Outcome.InProgressExecutionDelay]: {
    text: messages.cooldown,
    style: styles.pending
  },
  [Outcome.InProgressAwaitingExecution]: {
    text: messages.ready,
    style: styles.pending
  },
  [Outcome.Rejected]: { text: messages.failed, style: styles.failed },
  [Outcome.ApprovedExecuted]: { text: messages.passed, style: styles.passed },
  [Outcome.QuorumNotMet]: { text: messages.failed, style: styles.failed },
  [Outcome.ApprovedExecutionFailed]: {
    text: messages.failed,
    style: styles.failed
  },
  [Outcome.Evaluating]: {
    text: messages.executionPending,
    style: styles.pending
  },
  [Outcome.Vetoed]: { text: messages.failed, style: styles.failed },
  [Outcome.TargetContractAddressChanged]: {
    text: messages.failed,
    style: styles.failed
  },
  [Outcome.TargetContractCodeHashChanged]: {
    text: messages.failed,
    style: styles.failed
  }
}

type OwnProps = {
  outcome: Outcome
}

type ProposalStatusBadgeProps = OwnProps

const ProposalStatusBadge: React.FC<ProposalStatusBadgeProps> = ({
  outcome
}) => {
  const { text, style } = outcomeMapping[outcome]
  return <div className={clsx(styles.badge, style)}>{text}</div>
}

export default ProposalStatusBadge
