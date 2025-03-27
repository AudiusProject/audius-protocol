import React from 'react'

import {
  challengeRewardsConfig,
  getChallengeStatusLabel
} from '@audius/common/utils'

import { Text, Button, IconCheck, Flex } from '@audius/harmony-native'

import { ChallengeRewardsLayout } from './ChallengeRewardsLayout'
import { ClaimError } from './ClaimError'
import type { ChallengeContentProps } from './types'

const messages = {
  claim: 'Claim This Reward',
  claimableAmountLabel: (amount: number) => `Claim ${amount} $AUDIO`,
  claiming: 'Claiming',
  close: 'Close',
  rewardSubtext: '$AUDIO/Comment Pin'
}

export const CommentPinChallengeContent = ({
  challenge,
  challengeName,
  claimStatus,
  aaoErrorCode,
  onClaim,
  onClose
}: ChallengeContentProps) => {
  const { fullDescription } = challengeRewardsConfig[challengeName]

  const isClaimable =
    challenge?.claimableAmount && challenge.claimableAmount > 0

  const claimInProgress =
    claimStatus === 'claiming' || claimStatus === 'waiting for retry'
  const claimError = claimStatus === 'error'

  const statusText = challenge
    ? getChallengeStatusLabel(challenge, challengeName)
    : ''

  const statusLabel = (
    <Flex
      w='100%'
      ph='xl'
      border='default'
      borderRadius='s'
      backgroundColor='surface1'
    >
      <Flex
        row
        w='100%'
        alignItems='center'
        justifyContent='center'
        gap='s'
        pv='l'
      >
        {isClaimable ? <IconCheck size='s' color='subdued' /> : null}
        <Flex mt='unitHalf'>
          <Text variant='label' size='l' color='subdued'>
            {statusText}
          </Text>
        </Flex>
      </Flex>
    </Flex>
  )

  const actions =
    isClaimable && onClaim ? (
      <Button
        variant='primary'
        isLoading={claimInProgress}
        onPress={() => challenge && onClaim()}
        fullWidth
      >
        {claimInProgress
          ? messages.claiming
          : messages.claimableAmountLabel(challenge?.claimableAmount ?? 0)}
      </Button>
    ) : (
      <Button variant='secondary' onPress={onClose} fullWidth>
        {messages.close}
      </Button>
    )

  return (
    <ChallengeRewardsLayout
      description={challenge ? fullDescription?.(challenge) : ''}
      amount={challenge?.amount}
      rewardSubtext={messages.rewardSubtext}
      showProgressBar={false}
      statusLabel={statusLabel}
      actions={actions}
      errorContent={
        claimError ? <ClaimError aaoErrorCode={aaoErrorCode} /> : null
      }
      isCooldownChallenge={!!challenge?.cooldown_days}
    />
  )
}
