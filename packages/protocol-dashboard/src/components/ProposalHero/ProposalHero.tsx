import React, { useState, useCallback, useEffect } from 'react'
import { Utils } from '@audius/libs'

import Paper from 'components/Paper'
import VoteMeter from 'components/VoteMeter'
import ProposalStatusBadge from 'components/ProposalStatusBadge'
import { Proposal, Outcome, Vote, Address, Status } from 'types'
import Button, { ButtonType } from 'components/Button'
import { leftPadZero, getDate, getHumanReadableTime } from 'utils/format'
import { ReactComponent as IconThumbUp } from 'assets/img/iconThumbUp.svg'
import { ReactComponent as IconThumbDown } from 'assets/img/iconThumbDown.svg'
import ConfirmTransactionModal from 'components/ConfirmTransactionModal'
import { useSubmitVote } from 'store/actions/submitVote'
import { StandaloneBox } from 'components/ConfirmTransactionModal/ConfirmTransactionModal'
import Loading from 'components/Loading'
import DisplayAudio from 'components/DisplayAudio'
import {
  useProposalTimeRemaining,
  useAmountAbstained
} from 'store/cache/proposals/hooks'
import { useAccountUser } from 'store/account/hooks'
import { Position } from 'components/Tooltip'
import { createStyles } from 'utils/mobile'
import { IconCheck, IconRemove } from '@audius/stems'

import desktopStyles from './ProposalHero.module.css'
import mobileStyles from './ProposalHeroMobile.module.css'
import getActiveStake from 'utils/activeStake'
import clsx from 'clsx'
import UserImage from 'components/UserImage'

const styles = createStyles({ desktopStyles, mobileStyles })

const messages = {
  voteFor: 'Vote For',
  voteAgainst: 'Vote Against',
  timeRemaining: 'Est. Time Remaining',
  targetBlock: 'Target Block',
  notVoted: 'NOT-VOTED',
  voted: 'VOTED',
  quorum: 'QUORUM',
  quorumMet: 'Quorum Met',
  quorumNotMet: 'Quorum Not Met'
}

type VoteCTAProps = {
  onVoteFor: () => void
  onVoteAgainst: () => void
  currentVote: Vote
  submissionBlock: number
}

const VoteCTA: React.FC<VoteCTAProps> = ({
  onVoteFor,
  onVoteAgainst,
  currentVote,
  submissionBlock
}) => {
  const { timeRemaining, targetBlock } = useProposalTimeRemaining(
    submissionBlock
  )

  const { status: userStatus, user: accountUser } = useAccountUser()
  const activeStake = accountUser
    ? getActiveStake(accountUser)
    : Utils.toBN('0')
  const isUserStaker = userStatus === Status.Success && !activeStake.isZero()

  return (
    <div className={styles.voteCTA}>
      <div className={styles.timeRemaining}>
        {timeRemaining !== null && (
          <>
            <div className={styles.title}>{messages.timeRemaining}</div>
            <div className={styles.time}>
              {getHumanReadableTime(timeRemaining)}
            </div>
          </>
        )}
        <div className={styles.blocks}>
          <span>{`${messages.targetBlock}: ${targetBlock}`}</span>
        </div>
      </div>
      {isUserStaker && (
        <div className={styles.vote}>
          <Button
            leftIcon={<IconThumbUp />}
            className={styles.voteFor}
            text={messages.voteFor}
            type={ButtonType.GREEN}
            onClick={onVoteFor}
            isDepressed={currentVote === Vote.Yes}
            isDisabled={currentVote === Vote.Yes}
          />
          <Button
            leftIcon={<IconThumbDown />}
            className={styles.voteAgainst}
            text={messages.voteAgainst}
            type={ButtonType.RED}
            onClick={onVoteAgainst}
            isDepressed={currentVote === Vote.No}
            isDisabled={currentVote === Vote.No}
          />
        </div>
      )}
    </div>
  )
}

const User = ({ wallet }: { wallet: Address }) => {
  return (
    <div className={styles.user}>
      <div className={styles.image}>
        <UserImage wallet={wallet} alt="User" />
      </div>
      {wallet}
    </div>
  )
}

type OwnProps = {
  proposal: Proposal
  userVote: Vote
}

type ProposalHeroProps = OwnProps

const ProposalHero: React.FC<ProposalHeroProps> = ({
  proposal,
  userVote
}: ProposalHeroProps) => {
  const [reset, setReset] = useState(false)
  useEffect(() => {
    if (reset) setReset(false)
  }, [reset, setReset])

  const { status, error, submitVote } = useSubmitVote(reset)

  const [currentVote, setCurrentVote] = useState<Vote>(userVote)
  const [newVote, setNewVote] = useState<Vote>(userVote)
  useEffect(() => {
    setCurrentVote(userVote)
  }, [userVote, setCurrentVote])

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const onCloseConfirm = useCallback(() => setIsConfirmModalOpen(false), [])

  const onVoteFor = useCallback(() => {
    setNewVote(Vote.Yes)
    setIsConfirmModalOpen(true)
  }, [setNewVote, setIsConfirmModalOpen])

  const onVoteAgainst = useCallback(() => {
    setNewVote(Vote.No)
    setIsConfirmModalOpen(true)
  }, [setNewVote, setIsConfirmModalOpen])

  const onConfirm = useCallback(() => {
    if (!!newVote) {
      submitVote(proposal.proposalId, newVote, currentVote)
    }
  }, [submitVote, newVote, currentVote, proposal])

  useEffect(() => {
    if (status === Status.Success) {
      setCurrentVote(newVote)
      setIsConfirmModalOpen(false)
      setReset(true)
    }
  }, [status, newVote, setCurrentVote, setReset])

  const amountAbstained = useAmountAbstained(proposal) || Utils.toBN('0')

  const isActive = proposal?.outcome === Outcome.InProgress
  const evaluatedBlockTimestamp = proposal?.evaluatedBlock?.timestamp ?? null

  const submitVoteBox = (
    <StandaloneBox className={styles.confirmation}>
      {`Voting ${newVote === Vote.Yes ? 'for' : 'against'} proposal ${
        proposal?.proposalId
      }`}
    </StandaloneBox>
  )

  const totalMagnitudeVoted = proposal
    ? proposal?.voteMagnitudeYes.add(proposal?.voteMagnitudeNo)
    : Utils.toBN('0')
  const hasMetQuorum = proposal
    ? totalMagnitudeVoted.gte(proposal.quorum)
    : false

  return (
    <Paper className={styles.container}>
      {proposal && proposal.proposer ? (
        <>
          <User wallet={proposal.proposer} />
          {isActive && (
            <VoteCTA
              currentVote={currentVote}
              onVoteFor={onVoteFor}
              onVoteAgainst={onVoteAgainst}
              submissionBlock={proposal.submissionBlockNumber}
            />
          )}
          <div className={styles.bottom}>
            <div className={styles.left}>
              <div className={styles.description}>{proposal.name}</div>
              <div className={styles.info}>
                <ProposalStatusBadge outcome={proposal.outcome} />
                <div className={styles.id}>
                  {leftPadZero(proposal.proposalId, 3)}
                </div>
                {evaluatedBlockTimestamp && (
                  <div className={styles.executed}>
                    {`Executed ${getDate(evaluatedBlockTimestamp * 1000)}`}
                  </div>
                )}
              </div>
              {isActive && hasMetQuorum && (
                <div className={styles.quorumStatusContainer}>
                  <div className={clsx(styles.circle, styles.met)}>
                    <IconCheck className={styles.icon} />
                  </div>
                  {messages.quorumMet}
                </div>
              )}
              {isActive && !hasMetQuorum && (
                <div className={styles.quorumStatusContainer}>
                  <div className={clsx(styles.circle, styles.notMet)}>
                    <IconRemove className={styles.icon} />
                  </div>
                  {messages.quorumNotMet}
                </div>
              )}
            </div>
            <div className={styles.stats}>
              <VoteMeter
                votesFor={proposal.voteMagnitudeYes}
                votesAgainst={proposal.voteMagnitudeNo}
              />
              <DisplayAudio
                position={Position.BOTTOM}
                className={styles.abstained}
                amount={amountAbstained}
                label={messages.notVoted}
              />
              {isActive && (
                <div className={styles.quorumContainer}>
                  <DisplayAudio
                    position={Position.BOTTOM}
                    className={styles.quorumValue}
                    amount={totalMagnitudeVoted}
                    label={messages.voted}
                  />
                  {' / '}
                  <DisplayAudio
                    position={Position.BOTTOM}
                    className={styles.quorumValue}
                    amount={proposal.quorum}
                    label={messages.quorum}
                  />
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className={styles.loadingContainer}>
          <Loading />
        </div>
      )}
      <ConfirmTransactionModal
        withArrow={false}
        isOpen={isConfirmModalOpen}
        onClose={onCloseConfirm}
        onConfirm={onConfirm}
        topBox={submitVoteBox}
        error={error}
        status={status}
      />
    </Paper>
  )
}

export default ProposalHero
