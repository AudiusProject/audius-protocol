import React, { ReactNode } from 'react'
import clsx from 'clsx'

import { ProposalEvent, VoteEvent, Vote, Event } from 'types'
import { useProposal } from 'store/cache/proposals/hooks'
import Proposal from 'components/Proposal'
import { useBlock } from 'store/cache/protocol/hooks'
import { getDate, formatWei, formatAud, formatShortWallet } from 'utils/format'
import { usePushRoute } from 'utils/effects'
import { accountPage, contentNodePage, discoveryNodePage } from 'utils/routes'
import { TICKER } from 'utils/consts'
import Tooltip, { Position } from 'components/Tooltip'

import desktopStyles from './TimelineEvent.module.css'
import mobileStyles from './TimelineEventMobile.module.css'
import { createStyles } from 'utils/mobile'

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

  if ('delegator' in event && 'decreaseAmount' in event) {
    const onClick = () => {
      if (parentOnClick) parentOnClick()
      pushRoute(accountPage(event.serviceProvider))
    }
    const header = 'UNDELEGATED'
    const title = (
      <span className={styles.titleContainer}>
        {`Decreased delegation`}
        <Tooltip
          position={Position.TOP}
          text={formatWei(event.decreaseAmount)}
          className={clsx(styles.titleSpacingLeft, styles.titleSpacingRight)}
        >
          {formatAud(event.decreaseAmount)}
        </Tooltip>
        {`${TICKER} to `}
        <span className={styles.titleSpacingLeft}>
          {formatShortWallet(event.serviceProvider)}
        </span>
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

  // stake actions can be
  // increases, decreases requested/evaluated/(eventually cancelled)
  if ('stakeAction' in event) {
    // TODO: need to handle cancel still

    const INCREASE = 'increase'
    const DECREASE_REQUESTED = 'decreaseRequested'
    const DECREASE_EVALUATED = 'decreaseEvaluated'
    const action = event.stakeAction

    const onClick = () => {
      if (parentOnClick) parentOnClick()
      // do nothing for stake actions
    }
    const header =
      action === INCREASE
        ? 'INCREASED STAKE'
        : action === DECREASE_REQUESTED
        ? 'REQUESTED STAKE DECREASE'
        : 'DECREASED STAKE'
    const title = (
      <span className={styles.titleContainer}>
        {`${
          action === INCREASE
            ? 'Increased'
            : action === DECREASE_REQUESTED
            ? 'Requested to decrease'
            : 'Decreased'
        } stake by`}
        <Tooltip
          position={Position.TOP}
          text={formatWei(
            action === INCREASE ? event.increaseAmount : event.decreaseAmount
          )}
          className={clsx(styles.titleSpacingLeft, styles.titleSpacingRight)}
        >
          {formatAud(
            action === INCREASE ? event.increaseAmount : event.decreaseAmount
          )}
        </Tooltip>
        {action === INCREASE || action === DECREASE_EVALUATED ? (
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
