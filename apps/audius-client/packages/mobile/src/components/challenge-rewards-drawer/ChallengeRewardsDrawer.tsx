import React from 'react'

import type { UserChallengeState } from '@audius/common'
import {
  fillString,
  formatNumberCommas,
  ClaimStatus,
  getAAOErrorEmojis
} from '@audius/common'
import type { ImageSourcePropType } from 'react-native'
import { View } from 'react-native'

import IconCheck from 'app/assets/images/iconCheck.svg'
import IconVerified from 'app/assets/images/iconVerified.svg'
import Button, { ButtonType } from 'app/components/button'
import { GradientText } from 'app/components/core'
import { AppDrawer } from 'app/components/drawer'
import LoadingSpinner from 'app/components/loading-spinner'
import { ProgressBar } from 'app/components/progress-bar'
import Text from 'app/components/text'
import { flexRowCentered, makeStyles } from 'app/styles'
import { useThemePalette } from 'app/utils/theme'

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
  claimErrorMessageAAO:
    'Your account is unable to claim rewards at this time. Please try again later or contact support@audius.co. ',
  claimableLabel: '$AUDIO available to claim',
  claimedLabel: '$AUDIO claimed so far'
}

const useStyles = makeStyles(({ palette, spacing }) => ({
  content: {
    padding: spacing(4),
    alignItems: 'center'
  },
  subheader: {
    textAlign: 'left',
    color: palette.neutralLight4,
    fontSize: spacing(4),
    textTransform: 'uppercase',
    marginBottom: spacing(3)
  },
  subheaderIcon: {
    marginBottom: spacing(3),
    marginRight: 10
  },
  task: {
    width: '100%',
    padding: spacing(6),
    paddingTop: 0
  },
  taskHeaderVerified: {
    ...flexRowCentered()
  },
  taskText: {
    fontSize: spacing(4)
  },
  statusGrid: {
    borderRadius: spacing(4),
    borderColor: palette.neutralLight8,
    borderWidth: 1,
    width: '100%',
    marginBottom: spacing(6),
    flexDirection: 'column'
  },
  statusGridColumns: {
    padding: spacing(4),
    flexDirection: 'row',
    justifyContent: 'center'
  },
  rewardCell: {
    paddingRight: spacing(4)
  },
  progressCell: {
    flex: 1,
    paddingLeft: spacing(4),
    borderLeftWidth: 1,
    borderColor: palette.neutralLight8
  },
  statusCell: {
    alignItems: 'center',
    paddingLeft: 32,
    paddingRight: 32,
    paddingTop: spacing(3),
    backgroundColor: palette.neutralLight9,
    borderBottomLeftRadius: spacing(4),
    borderBottomRightRadius: spacing(4)
  },
  statusCellComplete: {
    backgroundColor: palette.staticAccentGreenLight1
  },
  statusTextInProgress: {
    color: palette.secondaryLight1
  },
  statusTextComplete: {
    color: palette.staticWhite
  },
  audioAmount: {
    textAlign: 'center',
    fontSize: 34
  },
  audioLabel: {
    textAlign: 'center',
    fontSize: spacing(3),
    color: palette.neutralLight4
  },
  claimRewardsContainer: {
    marginTop: spacing(4),
    width: '100%'
  },
  claimRewardsError: {
    textAlign: 'center',
    color: palette.accentRed,
    fontSize: spacing(4),
    marginTop: spacing(6)
  },
  claimButtonContainer: {
    width: '100%'
  },
  claimButton: {
    paddingVertical: spacing(3)
  },
  claimableAmount: {
    marginVertical: spacing(4),
    textAlign: 'center',
    textTransform: 'uppercase',
    color: palette.staticAccentGreenLight1
  },
  claimedAmount: {
    marginTop: spacing(4),
    textAlign: 'center',
    textTransform: 'uppercase',
    color: palette.neutralLight4
  }
}))

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
  aaoErrorCode,
  onClaim,
  isVerifiedChallenge,
  showProgressBar,
  children
}: ChallengeRewardsDrawerProps) => {
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
    <AppDrawer
      modalName='ChallengeRewardsExplainer'
      onClose={onClose}
      isFullscreen
      isGestureSupported={false}
      title={title}
      titleImage={titleIcon}
    >
      <View style={styles.content}>
        <View style={styles.task}>
          {isVerifiedChallenge ? (
            <View style={styles.taskHeaderVerified}>
              <IconVerified
                style={styles.subheaderIcon}
                fill={palette.staticPrimary}
                fillSecondary={palette.staticWhite}
              />
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
          {claimError ? getErrorMessage() : null}
        </View>
      </View>
    </AppDrawer>
  )
}
