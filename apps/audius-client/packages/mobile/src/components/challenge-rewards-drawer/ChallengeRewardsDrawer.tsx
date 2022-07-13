import React from 'react'

import { UserChallengeState } from 'audius-client/src/common/models/AudioRewards'
import { ClaimStatus } from 'audius-client/src/common/store/pages/audio-rewards/slice'
import { fillString } from 'audius-client/src/common/utils/fillString'
import { formatNumberCommas } from 'audius-client/src/common/utils/formatUtil'
import { StyleSheet, View, ImageSourcePropType } from 'react-native'

import IconCheck from 'app/assets/images/iconCheck.svg'
import IconVerified from 'app/assets/images/iconVerified.svg'
import Button, { ButtonType } from 'app/components/button'
import { GradientText } from 'app/components/core'
import { AppDrawer } from 'app/components/drawer'
import LoadingSpinner from 'app/components/loading-spinner'
import { ProgressBar } from 'app/components/progress-bar'
import Text from 'app/components/text'
import { useThemedStyles } from 'app/hooks/useThemedStyles'
import { flexRowCentered } from 'app/styles'
import { ThemeColors } from 'app/utils/theme'

const messages = {
  task: 'Task',
  taskVerified: 'Verified Challenge',
  reward: 'Reward',
  progress: 'Progress',
  audio: '$AUDIO',
  incomplete: 'Incomplete',
  complete: 'Complete',
  claim: 'Claim Your Reward',
  claimErrorMessage:
    'Something has gone wrong, not all your rewards were claimed. Please try again.',
  claimableLabel: '$AUDIO available to claim',
  claimedLabel: '$AUDIO claimed so far'
}

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    content: {
      padding: 16,
      alignItems: 'center'
    },
    subheader: {
      textAlign: 'left',
      color: themeColors.neutralLight4,
      fontSize: 16,
      textTransform: 'uppercase',
      marginBottom: 12
    },
    subheaderIcon: {
      marginBottom: 12,
      marginRight: 10
    },
    task: {
      width: '100%',
      padding: 24,
      paddingTop: 0
    },
    taskHeaderVerified: {
      ...flexRowCentered()
    },
    taskText: {
      fontSize: 16
    },
    statusGrid: {
      borderRadius: 16,
      borderColor: themeColors.neutralLight8,
      borderWidth: 1,
      width: '100%',
      marginBottom: 24,
      flexDirection: 'column'
    },
    statusGridColumns: {
      padding: 16,
      flexDirection: 'row',
      justifyContent: 'center'
    },
    rewardCell: {
      paddingRight: 16
    },
    progressCell: {
      flex: 1,
      paddingLeft: 16,
      borderLeftWidth: 1,
      borderColor: themeColors.neutralLight8
    },
    statusCell: {
      alignItems: 'center',
      paddingLeft: 32,
      paddingRight: 32,
      paddingTop: 12,
      backgroundColor: themeColors.neutralLight9,
      borderBottomLeftRadius: 16,
      borderBottomRightRadius: 16
    },
    statusCellComplete: {
      backgroundColor: themeColors.staticAccentGreenLight1
    },
    statusTextInProgress: {
      color: themeColors.secondaryLight1
    },
    statusTextComplete: {
      color: themeColors.staticWhite
    },
    audioAmount: {
      textAlign: 'center',
      fontSize: 34
    },
    audioLabel: {
      textAlign: 'center',
      fontSize: 12,
      color: themeColors.neutralLight4
    },
    claimRewardsContainer: {
      marginTop: 16,
      width: '100%'
    },
    claimRewardsError: {
      textAlign: 'center',
      color: themeColors.accentRed,
      fontSize: 16,
      marginTop: 24
    },
    claimButtonContainer: {
      width: '100%'
    },
    claimButton: {
      paddingVertical: 12
    },
    claimableAmount: {
      marginVertical: 16,
      textAlign: 'center',
      textTransform: 'uppercase',
      color: themeColors.staticAccentGreenLight1
    },
    claimedAmount: {
      marginTop: 16,
      textAlign: 'center',
      textTransform: 'uppercase',
      color: themeColors.neutralLight4
    }
  })

type ChallengeRewardsDrawerProps = {
  /** Callback for when the drawer gets closed */
  onClose: () => void
  /** Title text for the drawer */
  title: string
  /** Optional icon for the title */
  titleIcon?: ImageSourcePropType
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
  /** Callback that runs on the claim rewards button being clicked */
  onClaim?: () => void
  /** Whether the challenge is for verified users only */
  isVerifiedChallenge: boolean
  /** True if the challenge type is 'aggregate' */
  showProgressBar: boolean
  children?: React.ReactChild
}
export const ChallengeRewardsDrawer = ({
  onClose,
  title,
  titleIcon,
  description,
  amount,
  currentStep,
  stepCount = 1,
  progressLabel,
  challengeState,
  claimableAmount,
  claimedAmount,
  claimStatus,
  onClaim,
  isVerifiedChallenge,
  showProgressBar,
  children
}: ChallengeRewardsDrawerProps) => {
  const styles = useThemedStyles(createStyles)
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
    <AppDrawer
      modalName='ChallengeRewardsExplainer'
      onClose={onClose}
      isFullscreen
      isGestureSupported={false}
      title={title}
      titleIcon={titleIcon}>
      <View style={styles.content}>
        <View style={styles.task}>
          {isVerifiedChallenge ? (
            <View style={styles.taskHeaderVerified}>
              <IconVerified style={styles.subheaderIcon} />
              <Text style={styles.subheader} weight='heavy'>
                {messages.taskVerified}
              </Text>
            </View>
          ) : (
            <Text style={styles.subheader} weight='heavy'>
              {messages.task}
            </Text>
          )}
          <Text weight='bold' style={styles.taskText}>
            {description}
          </Text>
        </View>
        <View style={styles.statusGrid}>
          <View style={styles.statusGridColumns}>
            <View style={styles.rewardCell}>
              <Text style={styles.subheader} weight='heavy'>
                {messages.reward}
              </Text>
              <GradientText style={styles.audioAmount}>
                {formatNumberCommas(amount)}
              </GradientText>
              <Text style={styles.audioLabel} weight='heavy'>
                {messages.audio}
              </Text>
            </View>
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
            ]}>
            <Text
              style={[
                styles.subheader,
                hasCompleted ? styles.statusTextComplete : {},
                isInProgress ? styles.statusTextInProgress : {}
              ]}
              weight='heavy'>
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
                  weight='heavy'>
                  {claimableAmountText}
                </Text>,
                <Button
                  key='claimButton'
                  containerStyle={styles.claimButtonContainer}
                  style={styles.claimButton}
                  type={
                    claimInProgress ? ButtonType.COMMON : ButtonType.PRIMARY
                  }
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
          {claimError ? (
            <Text style={styles.claimRewardsError} weight='bold'>
              {messages.claimErrorMessage}
            </Text>
          ) : null}
        </View>
      </View>
    </AppDrawer>
  )
}
