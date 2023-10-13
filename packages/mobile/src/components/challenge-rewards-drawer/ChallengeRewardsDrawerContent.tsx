import React from 'react'

import type { UserChallengeState } from '@audius/common'
import {
  fillString,
  formatNumberCommas,
  ClaimStatus,
  getAAOErrorEmojis
} from '@audius/common'
import { View } from 'react-native'

import IconCheck from 'app/assets/images/iconCheck.svg'
import IconVerified from 'app/assets/images/iconVerified.svg'
import Button, { ButtonType } from 'app/components/button'
import LoadingSpinner from 'app/components/loading-spinner'
import { ProgressBar } from 'app/components/progress-bar'
import Text from 'app/components/text'
import { useThemePalette } from 'app/utils/theme'

import { ChallengeDescription } from './ChallengeDescription'
import { ChallengeReward } from './ChallengeReward'
import { useStyles } from './styles'

const messages = {
  taskVerified: 'Verified Challenge',
  progress: 'Progress',
  audio: '$AUDIO',
  incomplete: 'Incomplete',
  complete: 'Complete',
  claim: 'Claim Your Reward',
  claimErrorMessage:
    'Something has gone wrong, not all your rewards were claimed. Please try again.',
  claimErrorMessageAAO:
    'Your account is unable to claim rewards at this time. Please try again later or contact support@audius.co. ',
  claimableLabel: '$AUDIO available to claim',
  claimedLabel: '$AUDIO claimed so far'
}

type ChallengeRewardsDrawerContentProps = {
  /** The description of the challenge */
  description: string
  /** The current progress the user has made */
  currentStep: number
  /** The number of steps the user has to complete in total */
  stepCount?: number
  /** The amount of $AUDIO that is rewarded to the user for completing the challenge */
  amount: number
  /** The label to use for the in-progress status */
  progressLabel: string
  challengeState: UserChallengeState
  /** The amount of $AUDIO available to be claimed */
  claimableAmount: number
  /** The amount of $AUDIO the user has already claimed, used in aggregate challenges */
  claimedAmount: number
  /** The status of the rewards being claimed */
  claimStatus: ClaimStatus
  /** Error code from AAO in the case of AAO rejection */
  aaoErrorCode?: number
  /** Callback that runs on the claim rewards button being clicked */
  onClaim?: () => void
  /** Whether the challenge is for verified users only */
  isVerifiedChallenge: boolean
  /** True if the challenge type is 'aggregate' */
  showProgressBar: boolean
  children?: React.ReactChild
}

export const ChallengeRewardsDrawerContent = ({
  description,
  amount,
  currentStep,
  stepCount = 1,
  progressLabel,
  challengeState,
  claimableAmount,
  claimedAmount,
  claimStatus,
  aaoErrorCode,
  onClaim,
  isVerifiedChallenge,
  showProgressBar,
  children
}: ChallengeRewardsDrawerContentProps) => {
  const styles = useStyles()
  const palette = useThemePalette()
  const isInProgress = challengeState === 'in_progress'
  const claimInProgress =
    claimStatus === ClaimStatus.CLAIMING ||
    claimStatus === ClaimStatus.WAITING_FOR_RETRY
  const claimError = claimStatus === ClaimStatus.ERROR

  const hasCompleted =
    challengeState === 'completed' || challengeState === 'disbursed'
  const statusText = hasCompleted
    ? messages.complete
    : isInProgress
    ? fillString(
        progressLabel,
        formatNumberCommas(currentStep),
        formatNumberCommas(stepCount)
      )
    : messages.incomplete

  const claimedAmountText = `(${formatNumberCommas(claimedAmount)} ${
    messages.claimedLabel
  })`
  const claimableAmountText = `${formatNumberCommas(claimableAmount)} ${
    messages.claimableLabel
  }`

  const getErrorMessage = () => {
    if (aaoErrorCode === undefined) {
      return (
        <Text style={styles.claimRewardsError} weight='bold'>
          {messages.claimErrorMessage}
        </Text>
      )
    }
    return (
      <Text style={styles.claimRewardsError} weight='bold'>
        {messages.claimErrorMessageAAO}
        {getAAOErrorEmojis(aaoErrorCode)}
      </Text>
    )
  }
  return (
    <View style={styles.content}>
      {isVerifiedChallenge ? (
        <ChallengeDescription
          task={messages.taskVerified}
          taskIcon={
            <IconVerified
              style={styles.subheaderIcon}
              fill={palette.staticPrimary}
              fillSecondary={palette.staticWhite}
            />
          }
          description={description}
        />
      ) : (
        <ChallengeDescription description={description} />
      )}
      <View style={styles.statusGrid}>
        <View style={styles.statusGridColumns}>
          <ChallengeReward amount={amount} subtext={messages.audio} />
          {showProgressBar ? (
            <View style={styles.progressCell}>
              <Text style={styles.subheader} weight='heavy'>
                {messages.progress}
              </Text>
              <ProgressBar progress={currentStep} max={stepCount} />
            </View>
          ) : null}
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
      {children}
      <View style={styles.claimRewardsContainer}>
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
      </View>
    </View>
  )
}
