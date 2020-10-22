import React from 'react'
import styles from './ProposalStatusBadge.module.css'
import clsx from 'clsx'
import { Outcome } from 'types'

const messages = {
  open: 'open',
  executionPending: 'evaluating',
  passed: 'passed',
  failed: 'failed'
}

const outcomeMapping = {
  [Outcome.InProgress]: { text: messages.open, style: styles.open },
  [Outcome.Rejected]: { text: messages.failed, style: styles.failed },
  [Outcome.ApprovedExecuted]: { text: messages.passed, style: styles.passed },
  [Outcome.QuorumNotMet]: { text: messages.failed, style: styles.failed },
  [Outcome.ApprovedExecutionFailed]: {
    text: messages.failed,
    style: styles.failed
  },
  [Outcome.Evaluating]: {
    text: messages.executionPending,
    style: styles.executionPending
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
