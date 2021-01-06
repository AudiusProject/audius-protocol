import React, { ReactNode } from 'react'
import clsx from 'clsx'

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
import {
  ClaimProcessedEvent,
  DelegateClaimEvent,
  DelegateDecreaseStakeEvent,
  DelegateIncreaseStakeEvent,
  GovernanceProposalEvent,
  GovernanceVoteEvent,
  GovernanceVoteUpdateEvent,
  ServiceProviderDecreaseStakeEvent,
  ServiceProviderDeregisteredEvent,
  ServiceProviderIncreaseStakeEvent,
  ServiceProviderRegisteredEvent,
  TimelineEvent as TimelineEventType
} from 'models/TimelineEvents'

const styles = createStyles({ desktopStyles, mobileStyles })

const VoteTimelineEvent = ({
  className,
  onClick,
  event
}: {
  className?: string
  onClick?: () => void
  event: GovernanceVoteEvent | GovernanceVoteUpdateEvent
}) => {
  const { proposal } = useProposal(event.proposalId)
  const header = 'VOTED'
  return proposal ? (
    <Proposal
      header={header}
      onClick={onClick}
      className={className}
      proposal={proposal}
      vote={event.vote}
    />
  ) : null
}

const ProposalTimelineEvent = ({
  event,
  className,
  onClick
}: {
  event: GovernanceProposalEvent
  className?: string
  onClick?: () => void
}) => {
  const { proposal } = useProposal(event.proposalId)
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

const DelegationIncreaseEvent: React.FC<{
  event: DelegateIncreaseStakeEvent
  parentOnClick?: () => void
  pushRoute: ReturnType<typeof usePushRoute>
  className?: string
}> = ({ event, pushRoute, className, parentOnClick }) => {
  const received = event.direction === 'Received'

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
        {formatShortWallet(received ? event.delegator : event.serviceProvider)}
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

const DelegationDecreaseEvent: React.FC<{
  event: DelegateDecreaseStakeEvent
  parentOnClick?: () => void
  pushRoute: ReturnType<typeof usePushRoute>
  className?: string
}> = ({ event, pushRoute, className, parentOnClick }) => {
  const onClick = () => {
    if (parentOnClick) parentOnClick()
    const route =
      event.direction === 'Sent'
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

  const renderRequestSent = () => {
    return (
      <>
        {`Requested to decrease delegation to`}
        <span className={styles.titleSpacingLeft}>
          {formatShortWallet(event.serviceProvider)}
        </span>
        <span className={styles.titleSpacingLeft}>{' by'}</span>
        <Tooltip
          position={Position.TOP}
          text={formatWei(event.amount)}
          className={clsx(styles.titleSpacingLeft, styles.titleSpacingRight)}
        >
          {formatAud(event.amount)}
        </Tooltip>
        {TICKER}
      </>
    )
  }

  const renderRequestReceived = () => {
    return (
      <>
        {`Delegator`}
        <span className={styles.titleSpacingLeft}>
          {formatShortWallet(event.delegator)}
        </span>
        <span
          className={clsx(styles.titleSpacingLeft, styles.titleSpacingRight)}
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

  const renderEvaluatedSent = () => {
    return (
      <>
        {`Decreased delegation`}
        <Tooltip
          position={Position.TOP}
          text={formatWei(event.amount)}
          className={clsx(styles.titleSpacingLeft, styles.titleSpacingRight)}
        >
          {formatAud(event.amount)}
        </Tooltip>
        {`${TICKER} to `}
        <span className={styles.titleSpacingLeft}>
          {formatShortWallet(event.serviceProvider)}
        </span>
      </>
    )
  }

  const renderEvaluatedReceived = () => {
    return (
      <>
        {`Delegator`}
        <span className={styles.titleSpacingLeft}>
          {formatShortWallet(event.delegator)}
        </span>
        <span
          className={clsx(styles.titleSpacingLeft, styles.titleSpacingRight)}
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
  }

  const renderCancelledSent = () => {
    return (
      <>
        {`Cancelled request to decrease delegation to`}
        <span className={styles.titleSpacingLeft}>
          {formatShortWallet(event.serviceProvider)}
        </span>
        <span className={styles.titleSpacingLeft}>{'by'}</span>
        <Tooltip
          position={Position.TOP}
          text={formatWei(event.amount)}
          className={clsx(styles.titleSpacingLeft, styles.titleSpacingRight)}
        >
          {formatAud(event.amount)}
        </Tooltip>
        {TICKER}
      </>
    )
  }

  const renderCancelledReceived = () => {
    return (
      <>
        {`Delegator ${formatShortWallet(
          event.delegator
        )} cancelled request to decrease delegation by`}
        <Tooltip
          position={Position.TOP}
          text={formatWei(event.amount)}
          className={clsx(styles.titleSpacingLeft, styles.titleSpacingRight)}
        >
          {formatAud(event.amount)}
        </Tooltip>
        {TICKER}
      </>
    )
  }

  const headersMap = {
    Evaluated: {
      Sent: 'UNDELEGATED',
      Received: 'UNDELEGATION'
    },
    Cancelled: {
      Sent: 'UNDELEGATE REQUEST CANCELLED',
      Received: 'UNDELEGATION REQUEST CANCELLED'
    },
    Requested: {
      Sent: 'UNDELEGATE REQUESTED',
      Received: 'UNDELEGATION REQUESTED'
    }
  }

  const bodyMap = {
    Requested: { Sent: renderRequestSent, Received: renderRequestReceived },
    Evaluated: { Sent: renderEvaluatedSent, Received: renderEvaluatedReceived },
    Cancelled: { Sent: renderCancelledSent, Received: renderCancelledReceived }
  }

  const header = headersMap[event.data._type][event.direction]
  const body = bodyMap[event.data._type][event.direction]()
  const title = <span className={styles.titleContainer}>{body}</span>
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

const RegistrationDeregistrationEvent: React.FC<{
  parentOnClick?: () => void
  pushRoute: ReturnType<typeof usePushRoute>
  event: ServiceProviderRegisteredEvent | ServiceProviderDeregisteredEvent
  className?: string
}> = ({ event, parentOnClick, pushRoute, className }) => {
  const didRegister = event._type === 'ServiceProviderRegistered'

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
const ClaimEvent: React.FC<{
  parentOnClick?: () => void
  event: DelegateClaimEvent | ClaimProcessedEvent
  pushRoute: ReturnType<typeof usePushRoute>
  className?: string
}> = ({ event, parentOnClick, className, pushRoute }) => {
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

const ServiceProviderStakeEvent: React.FC<{
  parentOnClick?: () => void
  event: ServiceProviderIncreaseStakeEvent | ServiceProviderDecreaseStakeEvent
  className?: string
}> = ({ event, parentOnClick, className }) => {
  const onClick = () => {
    if (parentOnClick) parentOnClick()
    // do nothing for stake actions
  }

  const decreaseStakeHeaders = {
    Requested: 'REQUESTED STAKE DECREASE',
    Evaluated: 'DECREASED STAKE',
    Cancelled: 'CANCELLED DECREASE STAKE REQUEST'
  }
  const header =
    event._type === 'ServiceProviderIncreaseStake'
      ? 'INCREASED STAKE'
      : decreaseStakeHeaders[event.data._type]

  const sentenceFragmentMap1 = {
    Requested: 'Requested to decrease',
    Evaluated: 'Decreased',
    Cancelled: 'Cancelled request to decrease'
  }
  const sentenceFragment1 =
    event._type === 'ServiceProviderIncreaseStake'
      ? 'Increased'
      : sentenceFragmentMap1[event.data._type]

  const amount =
    event._type === 'ServiceProviderIncreaseStake'
      ? event.increaseAmount
      : event.decreaseAmount

  const renderTitle = () => {
    let newAmount = null
    if (event._type === 'ServiceProviderIncreaseStake') {
      newAmount = event.newStakeAmount
    } else if (event.data._type === 'Evaluated') {
      newAmount = event.data.newStakeAmount
    }

    return (
      <span className={styles.titleContainer}>
        {`${sentenceFragment1} stake by`}
        <Tooltip
          position={Position.TOP}
          text={formatWei(amount)}
          className={clsx(styles.titleSpacingLeft, styles.titleSpacingRight)}
        >
          {formatAud(amount)}
        </Tooltip>
        {newAmount ? (
          <>
            {'to'}
            <Tooltip
              position={Position.TOP}
              text={formatWei(newAmount)}
              className={clsx(
                styles.titleSpacingLeft,
                styles.titleSpacingRight
              )}
            >
              {formatAud(newAmount)}
            </Tooltip>
            {TICKER}
          </>
        ) : (
          TICKER
        )}
      </span>
    )
  }

  return (
    <GenericTimelineEvent
      onClick={onClick}
      className={className}
      header={header}
      title={renderTitle()}
      blockNumber={event.blockNumber}
    />
  )
}

type OwnProps = {
  className?: string
  onClick?: () => void
  event: TimelineEventType
}

type TimelineEventProps = OwnProps

const TimelineEvent: React.FC<TimelineEventProps> = ({
  onClick: parentOnClick,
  className,
  event
}: TimelineEventProps) => {
  const pushRoute = usePushRoute()

  if (!event) return null

  switch (event._type) {
    // Governance
    case 'GovernanceVote':
    case 'GovernanceVoteUpdate':
      return (
        <VoteTimelineEvent
          onClick={parentOnClick}
          className={clsx(styles.proposalEvent, { [className!]: !!className })}
          event={event}
        />
      )
    case 'GovernanceProposal':
      return (
        <ProposalTimelineEvent
          onClick={parentOnClick}
          className={clsx(styles.proposalEvent, { [className!]: !!className })}
          event={event}
        />
      )

    // Delegation
    case 'DelegateIncreaseStake':
      return (
        <DelegationIncreaseEvent
          event={event}
          pushRoute={pushRoute}
          parentOnClick={parentOnClick}
        />
      )
    case 'DelegateDecreaseStake':
      return (
        <DelegationDecreaseEvent
          event={event}
          pushRoute={pushRoute}
          parentOnClick={parentOnClick}
        />
      )

    // SP
    case 'ServiceProviderRegistered':
    case 'ServiceProviderDeregistered':
      return (
        <RegistrationDeregistrationEvent
          event={event}
          pushRoute={pushRoute}
          parentOnClick={parentOnClick}
        />
      )
    case 'ServiceProviderIncreaseStake':
    case 'ServiceProviderDecreaseStake':
      return (
        <ServiceProviderStakeEvent
          event={event}
          className={className}
          parentOnClick={parentOnClick}
        />
      )

    // Claim
    case 'DelegateClaim':
    case 'ClaimProcessed':
      return (
        <ClaimEvent
          event={event}
          className={className}
          parentOnClick={parentOnClick}
          pushRoute={pushRoute}
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
