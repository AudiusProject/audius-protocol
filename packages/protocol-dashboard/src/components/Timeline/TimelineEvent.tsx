import React, { ReactNode } from 'react'
import clsx from 'clsx'

import { ProposalEvent, VoteEvent, Vote, Event } from 'types'
import { useProposal } from 'store/cache/proposals/hooks'
import Proposal from 'components/Proposal'
import { useBlock } from 'store/cache/protocol/hooks'
import { getDate, formatWei, formatAud, formatShortWallet } from 'utils/format'
import { usePushRoute } from 'utils/effects'
import {
  accountPage,
  contentNodePage,
  discoveryNodePage,
  operatorPage
} from 'utils/routes'
import { TICKER } from 'utils/consts'
import Tooltip, { Position } from 'components/Tooltip'

import desktopStyles from './TimelineEvent.module.css'
import mobileStyles from './TimelineEventMobile.module.css'
import { createStyles } from 'utils/mobile'
import { TimelineType } from 'store/cache/timeline/hooks'

const styles = createStyles({ desktopStyles, mobileStyles })

const VoteTimelineEvent = ({
  className,
  proposalId,
  vote,
  onClick
}: {
  className?: string
  proposalId: number
  vote: Vote
  onClick?: () => void
}) => {
  const { proposal } = useProposal(proposalId)
  const header = 'VOTED'
  return proposal ? (
    <Proposal
      header={header}
      onClick={onClick}
      className={className}
      proposal={proposal}
      vote={vote}
    />
  ) : null
}

const ProposalTimelineEvent = ({
  proposalId,
  className,
  onClick
}: {
  proposalId: number
  className?: string
  onClick?: () => void
}) => {
  const { proposal } = useProposal(proposalId)
  const header = 'PROPOSED'
  if (proposal) {
    const modified = {
      ...proposal,
      description: `Proposed: ${proposal.description}`
    }
    return (
      <Proposal
        header={header}
        onClick={onClick}
        className={className}
        proposal={modified}
      />
    )
  }
  return null
}

const GenericTimelineEvent = ({
  className,
  header,
  title,
  blockNumber,
  onClick = () => {}
}: {
  onClick?: () => void
  header?: string
  className?: string
  title: ReactNode
  blockNumber: number
}) => {
  const block = useBlock(blockNumber)
  return (
    <div
      onClick={onClick}
      className={clsx(styles.container, {
        [styles.onClick]: !!onClick,
        [className!]: !!className
      })}
    >
      <div className={styles.header}>{header}</div>
      <div className={styles.title}>{title}</div>
      {block && (
        <div className={styles.executed}>
          {`Executed ${getDate(block.timestamp * 1000)}`}
        </div>
      )}
    </div>
  )
}

type OwnProps = {
  className?: string
  onClick?: () => void
  event: ProposalEvent | VoteEvent | Event
}

type TimelineEventProps = OwnProps

const TimelineEvent: React.FC<TimelineEventProps> = ({
  onClick: parentOnClick,
  className,
  event
}: TimelineEventProps) => {
  const pushRoute = usePushRoute()

  if (!event) return null

  if ('voter' in event) {
    return (
      <VoteTimelineEvent
        onClick={parentOnClick}
        className={clsx(styles.proposalEvent, { [className!]: !!className })}
        proposalId={event.proposalId}
        vote={event.vote}
      />
    )
  }

  if ('proposer' in event) {
    return (
      <ProposalTimelineEvent
        onClick={parentOnClick}
        className={clsx(styles.proposalEvent, { [className!]: !!className })}
        proposalId={event.proposalId}
      />
    )
  }

  // Handle increase delegation events
  if (
    'delegator' in event &&
    'increaseAmount' in event &&
    'direction' in event
  ) {
    const received = event.direction === 'RECEIVED'

    const onClick = () => {
      if (parentOnClick) parentOnClick()
      pushRoute(accountPage(received ? event.delegator : event.serviceProvider))
    }

    const header = received ? 'DELEGATION' : 'DELEGATED'
    const title = (
      <span className={styles.titleContainer}>
        {received ? `Received` : `Delegated`}
        <Tooltip
          position={Position.TOP}
          text={formatWei(event.increaseAmount)}
          className={clsx(styles.titleSpacingLeft, styles.titleSpacingRight)}
        >
          {formatAud(event.increaseAmount)}
        </Tooltip>
        {`${TICKER} ${received ? 'from' : 'to'} `}
        <span className={styles.titleSpacingLeft}>
          {formatShortWallet(
            received ? event.delegator : event.serviceProvider
          )}
        </span>
      </span>
    )
    return (
      <GenericTimelineEvent
        header={header}
        onClick={onClick}
        className={className}
        title={title}
        blockNumber={event.blockNumber}
      />
    )
  }

  // Handle decrease events
  if ('decreaseDelegation' in event) {
    const stage: 'cancelled' | 'requested' | 'evaluated' = event.stage
    const userType: TimelineType = event.userType

    // headers indexed by stage + userType
    const headersMap = {
      evaluated: {
        Delegator: 'UNDELEGATED',
        ServiceProvider: 'UNDELEGATION'
      },
      cancelled: {
        Delegator: 'UNDELEGATE REQUEST CANCELLED',
        ServiceProvider: 'UNDELEGATION REQUEST CANCELLED'
      },
      requested: {
        Delegator: 'UNDELEGATE REQUESTED',
        ServiceProvider: 'UNDELEGATION REQUESTED'
      }
    }

    const onClick = () => {
      if (parentOnClick) parentOnClick()
      const route =
        userType === 'Delegator'
          ? operatorPage(event.serviceProvider)
          : accountPage(event.delegator)
      pushRoute(route)
    }

    // Text looks like
    // Evaluated:
    //  Delegator: Decreased delegation X Audio To SP Y
    //  SP: Delegator X decreased delegation by Y Audio
    // Requested:
    //  Delegator: Requested to decrease delegation to SP Y by X Audio
    //  SP: Delegator X requested to decrease delegation by Y Audio
    // Cancelled:
    //  Delegator: Cancelled request to decrease delegation To SP Y by X Audio'
    //  SP: Delegator X cancelled requested to decrease delegation by Y Audio

    const bodyMap = {
      evaluated: {
        Delegator: (
          <>
            {`Decreased delegation`}
            <Tooltip
              position={Position.TOP}
              text={formatWei(event.decreaseAmount)}
              className={clsx(
                styles.titleSpacingLeft,
                styles.titleSpacingRight
              )}
            >
              {formatAud(event.decreaseAmount)}
            </Tooltip>
            {`${TICKER} to `}
            <span className={styles.titleSpacingLeft}>
              {formatShortWallet(event.serviceProvider)}
            </span>
          </>
        ),
        ServiceProvider: (
          <>
            {`Delegator`}
            <span className={styles.titleSpacingLeft}>
              ${formatShortWallet(event.delegator)}
            </span>
            <span
              className={clsx(
                styles.titleSpacingLeft,
                styles.titleSpacingRight
              )}
            >
              {'decreased delegation by'}
            </span>
            <Tooltip
              position={Position.TOP}
              text={formatWei(event.amount)}
              className={styles.titleSpacingRight}
            >
              {formatAud(event.amount)}
            </Tooltip>
            {TICKER}
          </>
        )
      },
      cancelled: {
        Delegator: (
          <>
            {`Cancelled request to decrease delegation to`}
            <span className={styles.titleSpacingLeft}>
              {formatShortWallet(event.serviceProvider)}
            </span>
            <span className={styles.titleSpacingLeft}>{'by'}</span>
            <Tooltip
              position={Position.TOP}
              text={formatWei(event.amount)}
              className={clsx(
                styles.titleSpacingLeft,
                styles.titleSpacingRight
              )}
            >
              {formatAud(event.amount)}
            </Tooltip>
            {TICKER}
          </>
        ),
        ServiceProvider: (
          <>
            {`Delegator ${formatShortWallet(
              event.delegator
            )} cancelled request to decrease delegation by`}
            <Tooltip
              position={Position.TOP}
              text={formatWei(event.amount)}
              className={clsx(
                styles.titleSpacingLeft,
                styles.titleSpacingRight
              )}
            >
              {formatAud(event.amount)}
            </Tooltip>
            {TICKER}
          </>
        )
      },
      requested: {
        Delegator: (
          <>
            {`Requested to decrease delegation to`}
            <span className={styles.titleSpacingLeft}>
              {formatShortWallet(event.serviceProvider)}
            </span>
            <span className={styles.titleSpacingLeft}>{' by'}</span>
            <Tooltip
              position={Position.TOP}
              text={formatWei(event.amount)}
              className={clsx(
                styles.titleSpacingLeft,
                styles.titleSpacingRight
              )}
            >
              {formatAud(event.amount)}
            </Tooltip>
            {TICKER}
          </>
        ),
        ServiceProvider: (
          <>
            {`Delegator`}
            <span className={styles.titleSpacingLeft}>
              ${formatShortWallet(event.delegator)}
            </span>
            <span
              className={clsx(
                styles.titleSpacingLeft,
                styles.titleSpacingRight
              )}
            >
              {`requested to decrease delegation by`}
            </span>
            <Tooltip
              position={Position.TOP}
              text={formatWei(event.amount)}
              className={styles.titleSpacingRight}
            >
              {formatAud(event.amount)}
            </Tooltip>
            {TICKER}
          </>
        )
      }
    }

    const header = headersMap[stage][userType]
    const title = (
      <span className={styles.titleContainer}>{bodyMap[stage][userType]}</span>
    )
    return (
      <GenericTimelineEvent
        onClick={onClick}
        className={className}
        header={header}
        title={title}
        blockNumber={event.blockNumber}
      />
    )
  }

  if ('registrationAction' in event) {
    // did it register or deregister?
    const didRegister = event.registrationAction === 'register'

    // is it discovery-node or creator-node
    const isDiscovery =
      event.serviceType in ['discovery-node', 'discovery-provider']
    const onClick = () => {
      if (parentOnClick) parentOnClick()
      const route = isDiscovery
        ? discoveryNodePage(event.spID)
        : contentNodePage(event.spID)
      pushRoute(route)
    }
    const header = didRegister ? 'REGISTERED SERVICE' : 'DEREGISTERED SERVICE'
    const title = (
      <span className={styles.titleContainer}>
        {`${didRegister ? 'Registered' : 'Deregistered'} ${
          event.serviceType
        } at ${event.endpoint}`}
      </span>
    )
    return (
      <GenericTimelineEvent
        onClick={onClick}
        className={className}
        header={header}
        title={title}
        blockNumber={event.blockNumber}
      />
    )
  }

  // SPs: staking increase + decrease events
  // stake actions can be
  // increases, decreases requested/evaluated/(eventually cancelled)
  if ('stakeAction' in event) {
    const action:
      | 'increase'
      | 'decreaseRequested'
      | 'decreaseEvaluated'
      | 'decreaseCancelled' = event.stakeAction

    const onClick = () => {
      if (parentOnClick) parentOnClick()
      // do nothing for stake actions
    }

    const headerMap = {
      increase: 'INCREASED STAKE',
      decreaseRequested: 'REQUESTED STAKE DECREASE',
      decreaseEvaluated: 'DECREASED STAKE',
      decreaseCancelled: 'CANCELLED DECREASE STAKE REQUEST'
    }
    const header = headerMap[action]

    const sentenceFragmentMap1 = {
      increase: 'Increased',
      decreaseRequested: 'Requested to decrease',
      decreaseEvaluated: 'Decreased',
      decreaseCancelled: 'Cancelled request to decrease'
    }
    const sentenceFragment1 = sentenceFragmentMap1[action]

    const amount =
      action === 'increase' ? event.increaseAmount : event.decreaseAmount

    const title = (
      <span className={styles.titleContainer}>
        {`${sentenceFragment1} stake by`}
        <Tooltip
          position={Position.TOP}
          text={formatWei(amount)}
          className={clsx(styles.titleSpacingLeft, styles.titleSpacingRight)}
        >
          {formatAud(amount)}
        </Tooltip>
        {action === 'increase' || action === 'decreaseEvaluated' ? (
          <>
            {'to'}
            <Tooltip
              position={Position.TOP}
              text={formatWei(event.newStakeAmount)}
              className={clsx(
                styles.titleSpacingLeft,
                styles.titleSpacingRight
              )}
            >
              {formatAud(event.newStakeAmount)}
            </Tooltip>
            {TICKER}
          </>
        ) : (
          TICKER
        )}
      </span>
    )
    return (
      <GenericTimelineEvent
        onClick={onClick}
        className={className}
        header={header}
        title={title}
        blockNumber={event.blockNumber}
      />
    )
  }

  if ('claimer' in event && 'rewards' in event) {
    const onClick = () => {
      if (parentOnClick) parentOnClick()
      pushRoute(accountPage(event.claimer))
    }
    const header = 'CLAIMED'
    const title = (
      <span className={styles.titleContainer}>
        <span className={styles.titleSpacingRight}>
          {formatShortWallet(event.claimer)}
        </span>
        {` Claims`}
        <Tooltip
          position={Position.TOP}
          text={formatWei(event.rewards)}
          className={clsx(styles.titleSpacingLeft, styles.titleSpacingRight)}
        >
          {formatAud(event.rewards)}
        </Tooltip>
        {` ${TICKER}`}
      </span>
    )
    return (
      <GenericTimelineEvent
        onClick={onClick}
        className={className}
        header={header}
        title={title}
        blockNumber={event.blockNumber}
      />
    )
  }

  return (
    <GenericTimelineEvent
      className={className}
      title={JSON.stringify(event)}
      blockNumber={event.blockNumber}
    />
  )
}

export default TimelineEvent
