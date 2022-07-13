import { OptimisticUserChallenge } from 'audius-client/src/common/models/AudioRewards'
import { fillString } from 'audius-client/src/common/utils/fillString'
import { formatNumberCommas } from 'audius-client/src/common/utils/formatUtil'
import { View, Image } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'

import IconArrow from 'app/assets/images/iconArrow.svg'
import { Button, Text } from 'app/components/core'
import { ProgressBar } from 'app/components/progress-bar'
import { makeStyles } from 'app/styles'
import { ChallengeConfig } from 'app/utils/challenges'
import { useThemeColors } from 'app/utils/theme'

const messages = {
  completeLabel: 'COMPLETE',
  claimReward: 'Claim Your Reward'
}

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  root: {
    marginVertical: spacing(2),
    width: '100%',
    borderRadius: spacing(4),
    borderColor: palette.neutralLight7,
    borderWidth: 2,
    paddingVertical: spacing(10),
    paddingHorizontal: spacing(5)
  },
  header: {
    flexDirection: 'row',
    marginBottom: spacing(2)
  },
  headerImage: {
    width: 24,
    height: 24,
    marginRight: spacing(2),
    marginBottom: 6
  },
  title: {
    fontFamily: typography.fontByWeight.bold,
    fontSize: typography.fontSize.large,
    flex: 1
  },
  description: {
    fontFamily: typography.fontByWeight.demiBold,
    fontSize: typography.fontSize.small,
    color: palette.secondary,
    lineHeight: 17,
    marginBottom: spacing(6)
  },
  progress: {
    fontFamily: typography.fontByWeight.heavy,
    fontSize: typography.fontSize.medium,
    marginBottom: spacing(2),
    textTransform: 'uppercase'
  },
  progressBar: {
    marginBottom: spacing(2)
  }
}))

type PanelProps = {
  onPress: () => void
  challenge?: OptimisticUserChallenge
} & ChallengeConfig

export const Panel = ({
  onPress,
  icon,
  title,
  shortDescription,
  description,
  progressLabel,
  remainingLabel,
  buttonInfo,
  challenge
}: PanelProps) => {
  const styles = useStyles()
  const { accentGreen, neutralLight4 } = useThemeColors()

  const stepCount = challenge?.max_steps ?? 0
  const shouldShowCompleted =
    challenge?.state === 'completed' || challenge?.state === 'disbursed'
  const needsDisbursement = challenge && challenge.claimableAmount > 0
  const shouldShowProgressBar =
    stepCount > 1 && challenge?.challenge_type !== 'aggregate'

  const shouldShowProgress = !!progressLabel
  let progressLabelFilled: string | null = null
  if (shouldShowProgress) {
    if (shouldShowCompleted) {
      progressLabelFilled = messages.completeLabel
    } else if (challenge?.challenge_type === 'aggregate') {
      // Count down
      progressLabelFilled = fillString(
        remainingLabel ?? '',
        (challenge?.max_steps - challenge?.current_step_count)?.toString() ??
          '',
        formatNumberCommas(stepCount.toString())
      )
    } else {
      // Count up
      progressLabelFilled = fillString(
        progressLabel,
        challenge?.current_step_count?.toString() ?? '',
        formatNumberCommas(stepCount.toString())
      )
    }
  }

  return (
    <TouchableOpacity style={styles.root} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <Image style={styles.headerImage} source={icon} />
        <Text style={styles.title}>{title}</Text>
      </View>
      <Text style={styles.description}>{shortDescription || description}</Text>
      {shouldShowProgress ? (
        <Text
          style={[
            styles.progress,
            {
              color: shouldShowCompleted ? accentGreen : neutralLight4
            }
          ]}>
          {progressLabelFilled}
        </Text>
      ) : null}
      {shouldShowProgressBar ? (
        <View style={styles.progressBar}>
          <ProgressBar
            progress={challenge?.current_step_count ?? 0}
            max={stepCount}
          />
        </View>
      ) : null}
      {buttonInfo ? (
        <Button
          fullWidth
          title={needsDisbursement ? messages.claimReward : buttonInfo.label}
          variant='primary'
          iconPosition='right'
          size='medium'
          icon={IconArrow}
          onPress={onPress}
        />
      ) : null}
    </TouchableOpacity>
  )
}
