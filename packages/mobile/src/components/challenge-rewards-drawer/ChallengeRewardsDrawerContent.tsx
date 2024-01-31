import React from 'react'

import type { UserChallengeState } from '@audius/common/models'
import { ClaimStatus } from '@audius/common/store'
import { fillString, formatNumberCommas } from '@audius/common/utils'
import { View } from 'react-native'

import IconCheck from 'app/assets/images/iconCheck.svg'
import IconVerified from 'app/assets/images/iconVerified.svg'
import Button, { ButtonType } from 'app/components/button'
import { Text } from 'app/components/core'
import LoadingSpinner from 'app/components/loading-spinner'
import { ProgressBar } from 'app/components/progress-bar'
import { useThemePalette } from 'app/utils/theme'

import { ChallengeDescription } from './ChallengeDescription'
import { ChallengeReward } from './ChallengeReward'
import { ClaimError } from './ClaimError'
import { useStyles } from './styles'

const messages = {
  taskVerified: 'Verified Challenge',
  progress: 'Progress',
  audio: '$AUDIO',
  incomplete: 'Incomplete',
  complete: 'Complete',
  claim: 'Claim Your Reward',
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

/** Generic drawer content used for most challenges, responsible for rendering the
 * task, reward, progress, and actions.
 */
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
              <Text
                color='neutralLight4'
                style={[styles.subheader, styles.progressSubheader]}
                weight='heavy'
                textTransform='uppercase'
              >
                {messages.progress}
              </Text>
              <ProgressBar progress={currentStep} max={stepCount} />
            </View>
          ) : null}
        </View>
        <View
          style={[
            styles.statusCell,
            hasCompleted ? styles.statusCellComplete : null
          ]}
        >
          <Text
            style={[
              styles.subheader,
              hasCompleted ? styles.statusTextComplete : null,
              isInProgress ? styles.statusTextInProgress : null
            ]}
            weight='heavy'
            textTransform='uppercase'
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
                textTransform='uppercase'
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
        {claimError ? <ClaimError aaoErrorCode={aaoErrorCode} /> : null}
      </View>
    </View>
  )
}
