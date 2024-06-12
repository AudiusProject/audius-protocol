import React from 'react'

import type { OptimisticUserChallenge } from '@audius/common/models'
import { ChallengeName } from '@audius/common/models'
import { ClaimStatus } from '@audius/common/store'
import { formatNumberCommas } from '@audius/common/utils'
import { ScrollView, View } from 'react-native'

import type { ButtonProps } from '@audius/harmony-native'
import { IconArrowRight, IconCloudUpload, Button } from '@audius/harmony-native'
import { Text } from 'app/components/core'
import { getChallengeConfig } from 'app/utils/challenges'

import { ChallengeDescription } from './ChallengeDescription'
import { ChallengeReward } from './ChallengeReward'
import { ClaimError } from './ClaimError'
import { CooldownSummaryTable } from './CooldownSummaryTable'
import { useStyles } from './styles'

const messages = {
  taskDetails: 'Task Details',
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
  totalClaimed: (amount: string) => `Total $AUDIO Claimed: ${amount}`,
  claimAudio: (amount: string) => `Claim ${amount} $AUDIO`
}

type AudioMatchingChallengeName =
  | ChallengeName.AudioMatchingBuy
  | ChallengeName.AudioMatchingSell

type AudioMatchingChallengeDrawerContentProps = {
  aaoErrorCode?: number
  challenge: OptimisticUserChallenge
  challengeName: AudioMatchingChallengeName
  claimableAmount: number
  claimedAmount: number
  claimStatus: ClaimStatus
  onClaim?: () => void
  onNavigate: () => void
}

const ctaButtonProps: {
  [k in AudioMatchingChallengeName]: Pick<
    ButtonProps,
    'iconRight' | 'iconLeft' | 'children'
  >
} = {
  [ChallengeName.AudioMatchingBuy]: {
    iconRight: IconArrowRight,
    children: messages.viewPremiumTracks
  },
  [ChallengeName.AudioMatchingSell]: {
    iconLeft: IconCloudUpload,
    children: messages.uploadTrack
  }
}

/** Specialized drawer content override for audio matching challenges, which need
 * more complicated logic and the abiltity to render a cooldown table.
 */
export const AudioMatchingChallengeDrawerContent = ({
  aaoErrorCode,
  challenge,
  challengeName,
  claimableAmount,
  claimedAmount,
  claimStatus,
  onClaim,
  onNavigate
}: AudioMatchingChallengeDrawerContentProps) => {
  const styles = useStyles()
  const config = getChallengeConfig(challengeName)
  const claimInProgress =
    claimStatus === ClaimStatus.CLAIMING ||
    claimStatus === ClaimStatus.WAITING_FOR_RETRY
  const claimError = claimStatus === ClaimStatus.ERROR

  return (
    <View style={styles.scrollViewContainer}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <ChallengeDescription
          task={
            <Text
              variant='label'
              fontSize='medium'
              weight='heavy'
              textTransform='uppercase'
            >
              {messages.taskDetails}
            </Text>
          }
          renderDescription={() => (
            <View style={styles.audioMatchingDescriptionContainer}>
              <Text variant='body'>{config.description(challenge)}</Text>
              <Text variant='body' color='neutralLight4'>
                {messages.descriptionSubtext[challengeName]}
              </Text>
            </View>
          )}
        />
        <View style={styles.statusGrid}>
          <View style={styles.statusGridColumns}>
            <ChallengeReward
              amount={challenge.amount}
              subtext={messages.rewardMapping[challengeName]}
            />
          </View>
          {claimedAmount > 0 ? (
            <View style={styles.claimedAmountContainer}>
              <Text
                variant='label'
                fontSize='small'
                weight='heavy'
                textTransform='uppercase'
              >
                {messages.totalClaimed(formatNumberCommas(claimedAmount))}
              </Text>
            </View>
          ) : null}
        </View>
        <CooldownSummaryTable challengeId={challengeName} />
      </ScrollView>
      <View style={styles.stickyClaimRewardsContainer}>
        {claimableAmount > 0 && onClaim ? (
          <Button
            disabled={claimInProgress}
            variant='primary'
            onPress={onClaim}
            isLoading={claimInProgress}
            iconRight={IconArrowRight}
            fullWidth
          >
            {messages.claimAudio(formatNumberCommas(claimableAmount))}
          </Button>
        ) : (
          <Button
            {...ctaButtonProps[challengeName]}
            variant='secondary'
            onPress={onNavigate}
            fullWidth
          />
        )}
        {claimError ? <ClaimError aaoErrorCode={aaoErrorCode} /> : null}
      </View>
    </View>
  )
}
