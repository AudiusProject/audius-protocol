import { ClaimStatus } from 'audius-client/src/common/store/pages/audio-rewards/slice'
import { StyleSheet, View, ImageSourcePropType } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import IconCheck from 'app/assets/images/iconCheck.svg'
import Button, { ButtonType } from 'app/components/button'
import Drawer from 'app/components/drawer'
import GradientText from 'app/components/gradient-text'
import LoadingSpinner from 'app/components/loading-spinner'
import Text from 'app/components/text'
import { useThemedStyles } from 'app/hooks/useThemedStyles'
import { ThemeColors, useThemeColors } from 'app/utils/theme'

const messages = {
  task: 'Task',
  reward: 'Reward',
  progress: 'Progress',
  audio: '$AUDIO',
  incomplete: 'Incomplete',
  complete: 'Complete',
  claim: 'Claim Your Reward',
  claimErrorMessage: 'Oops, something’s gone wrong'
}

const createProgressBarStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    progressBarContainer: {
      backgroundColor: themeColors.neutralLight9,
      borderRadius: 22,
      height: 24,
      marginVertical: 14,
      overflow: 'hidden'
    },
    progressBar: {
      backgroundColor: 'black',
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0
    },
    shadow: {
      position: 'absolute',
      backgroundColor: 'white',
      alignSelf: 'center',
      shadowColor: 'black',
      shadowRadius: 4,
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 0 },
      elevation: -1
    },
    shadowTop: {
      top: -10,
      height: 10,
      width: '100%'
    },
    shadowBottom: {
      bottom: -10,
      height: 10,
      width: '100%'
    },
    shadowLeft: {
      left: -10,
      height: '100%',
      width: 10
    },
    shadowRight: {
      right: -10,
      height: '100%',
      width: 10
    }
  })

const ProgressBar = ({ progress, max }) => {
  const {
    pageHeaderGradientColor1,
    pageHeaderGradientColor2
  } = useThemeColors()
  const styles = useThemedStyles(createProgressBarStyles)
  return (
    <View style={styles.progressBarContainer}>
      <LinearGradient
        colors={[pageHeaderGradientColor1, pageHeaderGradientColor2]}
        useAngle={true}
        angle={315}
        style={[
          styles.progressBar,
          {
            width:
              progress > max
                ? '100%'
                : `${Math.round((progress * 100 * 100.0) / max) / 100.0}%`
          }
        ]}
      />
      <View style={[styles.shadow, styles.shadowTop]} />
      <View style={[styles.shadow, styles.shadowBottom]} />
      <View style={[styles.shadow, styles.shadowLeft]} />
      <View style={[styles.shadow, styles.shadowRight]} />
    </View>
  )
}

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    content: {
      padding: 16,
      display: 'flex',
      alignItems: 'center'
    },
    subheader: {
      textAlign: 'left',
      color: themeColors.neutralLight4,
      fontSize: 16,
      textTransform: 'uppercase',
      marginBottom: 12
    },
    task: {
      width: '100%',
      padding: 24,
      paddingTop: 0
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
      display: 'flex',
      flexDirection: 'column'
    },
    statusGridColumns: {
      padding: 16,
      display: 'flex',
      flexDirection: 'row'
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
      display: 'flex',
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
    }
  })

type ChallengeRewardsDrawerProps = {
  /** Shows/hides the drawer */
  isOpen: boolean
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
  /** Whether the challenge reward has already been disbursed */
  isDisbursed: boolean
  /** Whether the challenge is completed */
  isComplete: boolean
  /** The status of the rewards being claimed */
  claimStatus: ClaimStatus
  /** Callback that runs on the claim rewards button being clicked */
  onClaim?: () => void
  children?: React.ReactChild
}
export const ChallengeRewardsDrawer = ({
  isOpen,
  onClose,
  title,
  titleIcon,
  description,
  amount,
  currentStep,
  stepCount = 1,
  progressLabel,
  isDisbursed,
  isComplete,
  claimStatus,
  onClaim,
  children
}: ChallengeRewardsDrawerProps) => {
  const styles = useThemedStyles(createStyles)
  const isInProgress = currentStep > 0 && !isComplete
  const claimInProgress =
    claimStatus === ClaimStatus.CLAIMING ||
    claimStatus === ClaimStatus.WAITING_FOR_RETRY
  const claimError = claimStatus === ClaimStatus.ERROR

  const statusText = isComplete
    ? messages.complete
    : isInProgress
    ? `${currentStep}/${stepCount} ${progressLabel}`
    : messages.incomplete

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      isFullscreen
      isGestureSupported={false}
      title={title}
      titleIcon={titleIcon}
    >
      <View style={styles.content}>
        <View style={styles.task}>
          <Text style={styles.subheader} weight='heavy'>
            {messages.task}
          </Text>
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
              <GradientText text={`${amount}`} style={styles.audioAmount} />
              <Text style={styles.audioLabel} weight='heavy'>
                {messages.audio}
              </Text>
            </View>
            <View style={styles.progressCell}>
              <Text style={styles.subheader} weight='heavy'>
                {messages.progress}
              </Text>
              <ProgressBar progress={currentStep} max={stepCount} />
            </View>
          </View>
          <View
            style={[
              styles.statusCell,
              isComplete ? styles.statusCellComplete : {}
            ]}
          >
            <Text
              style={[
                styles.subheader,
                isComplete ? styles.statusTextComplete : {},
                isInProgress ? styles.statusTextInProgress : {}
              ]}
              weight='heavy'
            >
              {statusText}
            </Text>
          </View>
        </View>
        {children}
        {!isDisbursed && isComplete && onClaim && (
          <View style={styles.claimRewardsContainer}>
            <Button
              containerStyle={styles.claimButtonContainer}
              type={claimInProgress ? ButtonType.COMMON : ButtonType.PRIMARY}
              disabled={claimInProgress}
              title={messages.claim}
              onPress={onClaim}
              renderIcon={color =>
                claimInProgress ? (
                  <LoadingSpinner />
                ) : (
                  <IconCheck fill={color} />
                )
              }
              iconPosition='left'
            />
            {claimError && (
              <Text style={styles.claimRewardsError} weight='bold'>
                {messages.claimErrorMessage}
              </Text>
            )}
          </View>
        )}
      </View>
    </Drawer>
  )
}
