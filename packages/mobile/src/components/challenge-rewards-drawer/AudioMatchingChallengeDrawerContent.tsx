import React, { useCallback } from 'react'

import type { OptimisticUserChallenge } from '@audius/common'
import { ChallengeName, formatNumberCommas, ClaimStatus } from '@audius/common'
import { View } from 'react-native'

import IconCheck from 'app/assets/images/iconCheck.svg'
import Button, { ButtonType } from 'app/components/button'
import { GradientText, Text } from 'app/components/core'
import LoadingSpinner from 'app/components/loading-spinner'
import { getChallengeConfig } from 'app/utils/challenges'

import { ChallengeDescription } from './ChallengeDescription'
import { ChallengeReward } from './ChallengeReward'
import { useStyles } from './styles'

const messages = {
  rewardMapping: {
    [ChallengeName.AudioMatchingBuy]: '$AUDIO Every Dollar Spent',
    [ChallengeName.AudioMatchingSell]: '$AUDIO Every Dollar Earned'
  },
  descriptionSubtext: {
    [ChallengeName.AudioMatchingBuy]:
      'Note: There is a 7 day waiting period between when you purchase and when you can claim your reward.',
    [ChallengeName.AudioMatchingSell]:
      'Note: There is a 7 day waiting period between when your track is purchased and when you can claim your reward.'
  },
  viewPremiumTracks: 'View Premium Tracks',
  uploadTrack: 'Upload Track',
  totalEarned: (amount: string) => `Total $AUDIO Earned: ${amount}`,
  claimAudio: (amount: string) => `Claim ${amount} $AUDIO`
}

type AudioMatchingChallengeName =
  | ChallengeName.AudioMatchingBuy
  | ChallengeName.AudioMatchingSell

type AudioMatchingChallengeDrawerContentProps = {
  challenge: OptimisticUserChallenge
  challengeName: AudioMatchingChallengeName
  onClaim?: () => void
  /** The status of the rewards being claimed */
  claimStatus: ClaimStatus
  onNavigateAway: () => void
  //   errorContent?: ReactNode
}

export const AudioMatchingChallengeDrawerContent = ({
  challenge,
  challengeName,
  onClaim,
  claimStatus,
  onNavigateAway
}: AudioMatchingChallengeDrawerContentProps) => {
  const styles = useStyles()
  const config = getChallengeConfig(challengeName)
  const claimInProgress =
    claimStatus === ClaimStatus.CLAIMING ||
    claimStatus === ClaimStatus.WAITING_FOR_RETRY
  const onClickCTA = useCallback(() => {
    // TODO: Navigate to the correct page
  }, [challengeName, onNavigateAway])

  // TODO: Finish remaining components below, matching desktop
  return (
    <View style={styles.content}>
      <ChallengeDescription
        description={
          <>
            {config.description(challenge)}
            <Text variant='body' color='neutralLight4'>
              {messages.descriptionSubtext[challengeName]}
            </Text>
          </>
        }
      />
      <View style={styles.statusGrid}>
        <View style={styles.statusGridColumns}>
          <ChallengeReward
            amount={challenge.amount}
            subtext={messages.rewardMapping[challengeName]}
          />
        </View>
        <View
          style={[
            styles.statusCell,
            hasCompleted ? styles.statusCellComplete : {}
          ]}
        >
          <Text
            style={[
              styles.subheader,
              hasCompleted ? styles.statusTextComplete : {},
              isInProgress ? styles.statusTextInProgress : {}
            ]}
            weight='heavy'
          >
            {statusText}
          </Text>
        </View>
      </View>
      {/* <View style={styles.claimRewardsContainer}>
        {claimableAmount > 0 && onClaim
          ? [
              <Text
                key='claimableAmount'
                style={styles.claimableAmount}
                weight='heavy'
              >
                {claimableAmountText}
              </Text>,
              <Button
                key='claimButton'
                containerStyle={styles.claimButtonContainer}
                style={styles.claimButton}
                type={claimInProgress ? ButtonType.COMMON : ButtonType.PRIMARY}
                disabled={claimInProgress}
                title={messages.claim}
                onPress={onClaim}
                renderIcon={(color) =>
                  claimInProgress ? (
                    <LoadingSpinner />
                  ) : (
                    <IconCheck fill={color} />
                  )
                }
                iconPosition='left'
              />
            ]
          : null}
        {claimedAmount > 0 && challengeState !== 'disbursed' ? (
          <Text style={styles.claimedAmount} weight='heavy'>
            {claimedAmountText}
          </Text>
        ) : null}
        {claimError ? getErrorMessage() : null}
      </View> */}
    </View>
  )
}
