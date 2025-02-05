import React from 'react'

import type { OptimisticUserChallenge } from '@audius/common/models'
import { ChallengeName } from '@audius/common/models'
import { ClaimStatus } from '@audius/common/store'
import { formatNumberCommas } from '@audius/common/utils'
import { ScrollView } from 'react-native-gesture-handler'

import type { ButtonProps } from '@audius/harmony-native'
import {
  IconArrowRight,
  IconCloudUpload,
  Button,
  Text,
  Flex,
  IconCheck
} from '@audius/harmony-native'
import { getChallengeConfig } from 'app/utils/challenges'

import { ChallengeDescription } from './ChallengeDescription'
import { ChallengeReward } from './ChallengeReward'
import { ClaimError } from './ClaimError'
import { CooldownSummaryTable } from './CooldownSummaryTable'
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
  totalClaimed: (amount: string) => `Total $AUDIO Claimed: ${amount}`,
  claimAudio: (amount: string) => `Claim ${amount} $AUDIO`,
  readyToClaim: 'Ready to Claim',
  incomplete: 'No recent purchases'
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
  const isClaimable = claimableAmount > 0
  const statusText = isClaimable ? messages.readyToClaim : messages.incomplete

  return (
    <Flex style={styles.scrollViewContainer}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <ChallengeDescription
          renderDescription={() => (
            <Flex style={styles.audioMatchingDescriptionContainer}>
              <Text size='l'>{config.description(challenge)}</Text>
              <Text color='subdued'>
                {messages.descriptionSubtext[challengeName]}
              </Text>
            </Flex>
          )}
        />
        <Flex alignItems='center' gap='3xl' w='100%'>
          <ChallengeReward
            amount={challenge.amount}
            subtext={messages.rewardMapping[challengeName]}
          />
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
              {/* Hack due to broken lineHeight for certain fonts */}
              <Flex mt='unitHalf'>
                <Text variant='label' size='l' color='subdued'>
                  {statusText}
                </Text>
              </Flex>
            </Flex>
          </Flex>
          {claimedAmount > 0 ? (
            <Flex style={styles.claimedAmountContainer}>
              <Text
                variant='label'
                size='s'
                strength='strong'
                textTransform='uppercase'
              >
                {messages.totalClaimed(formatNumberCommas(claimedAmount))}
              </Text>
            </Flex>
          ) : null}
        </Flex>
        <CooldownSummaryTable challengeId={challengeName} />
      </ScrollView>
      <Flex w='100%' ph='l' pv='m' gap='l'>
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
      </Flex>
    </Flex>
  )
}
