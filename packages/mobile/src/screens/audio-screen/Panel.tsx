import { useFormattedProgressLabel } from '@audius/common/hooks'
import type { OptimisticUserChallenge } from '@audius/common/models'
import type { ChallengeRewardsInfo } from '@audius/common/utils'
import { isAudioMatchingChallenge } from '@audius/common/utils'
import { View, Image } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import LinearGradient from 'react-native-linear-gradient'

import { IconArrowRight, IconCheck, Button } from '@audius/harmony-native'
import { Text } from 'app/components/core'
import { ProgressBar } from 'app/components/progress-bar'
import { makeStyles } from 'app/styles'
import type { MobileChallengeConfig } from 'app/utils/challenges'
import { useThemeColors } from 'app/utils/theme'

const messages = {
  completeLabel: 'COMPLETE',
  claimReward: 'Claim This Reward',
  readyToClaim: 'Ready to Claim',
  pendingRewards: 'Pending Reward',
  viewDetails: 'View Details',
  new: 'New!'
}

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  root: {
    marginBottom: spacing(2),
    borderRadius: spacing(2),
    borderColor: palette.neutralLight7,
    borderWidth: 2,
    paddingBottom: spacing(8)
  },
  disbursed: {
    backgroundColor: palette.neutralLight10
  },
  content: {
    paddingHorizontal: spacing(5)
  },
  pillContainer: {
    height: spacing(6),
    margin: spacing(2),
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  pillMessage: {
    paddingVertical: spacing(1),
    paddingHorizontal: spacing(2),
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontByWeight.demiBold,
    lineHeight: spacing(4),
    color: palette.secondary,
    borderWidth: 1,
    borderRadius: 12,
    borderColor: palette.backgroundSecondary,
    overflow: 'hidden'
  },
  readyToClaimPill: {
    backgroundColor: palette.background
  },
  newChallengeText: {
    textShadowOffset: { width: 0, height: 1.4 },
    textShadowRadius: 8,
    textShadowColor: 'rgba(0,0,0,0.2)',
    lineHeight: typography.fontSize.medium
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
    color: palette.neutral,
    lineHeight: 17,
    marginBottom: spacing(6)
  },
  progress: {
    fontFamily: typography.fontByWeight.heavy,
    fontSize: typography.fontSize.medium,
    marginBottom: spacing(2),
    textTransform: 'uppercase',
    color: palette.neutralLight4
  },
  button: {
    marginTop: spacing(4)
  },
  progressLabel: {
    display: 'flex',
    flexDirection: 'row'
  },
  iconCheck: {
    marginBottom: spacing(2),
    marginRight: spacing(2)
  }
}))

type PanelProps = {
  onPress: () => void
  challenge?: OptimisticUserChallenge
} & ChallengeRewardsInfo &
  MobileChallengeConfig

export const Panel = ({
  id,
  onPress,
  icon,
  title,
  shortDescription,
  description,
  progressLabel,
  remainingLabel,
  challenge,
  panelButtonText
}: PanelProps) => {
  const styles = useStyles()
  const { neutralLight4 } = useThemeColors()

  const maxStepCount = challenge?.max_steps ?? 0
  const hasDisbursed = challenge?.state === 'disbursed'
  const shouldShowProgressBar =
    maxStepCount > 1 &&
    challenge?.challenge_type !== 'aggregate' &&
    !hasDisbursed
  const needsDisbursement = challenge && challenge.claimableAmount > 0
  const showNewChallengePill =
    !needsDisbursement && isAudioMatchingChallenge(id)

  const shouldShowProgressLabel = !!progressLabel

  const formattedProgressLabel: string = useFormattedProgressLabel({
    challenge,
    progressLabel,
    remainingLabel
  })

  const buttonMessage = needsDisbursement
    ? messages.claimReward
    : hasDisbursed
      ? messages.viewDetails
      : panelButtonText

  return (
    <TouchableOpacity
      style={[styles.root, hasDisbursed ? styles.disbursed : null]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.pillContainer}>
        {needsDisbursement ? (
          <Text style={[styles.pillMessage, styles.readyToClaimPill]}>
            {messages.readyToClaim}
          </Text>
        ) : showNewChallengePill ? (
          <LinearGradient
            useAngle={true}
            angle={125}
            colors={['#19CCA2', '#61FA66']}
            style={styles.pillMessage}
          >
            <Text
              variant='body'
              fontSize='medium'
              weight='demiBold'
              color='staticWhite'
              style={styles.newChallengeText}
            >
              {messages.new}
            </Text>
          </LinearGradient>
        ) : null}
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          {icon ? <Image style={styles.headerImage} source={icon} /> : null}
          <Text style={styles.title}>{title}</Text>
        </View>
        <Text style={styles.description}>
          {shortDescription || description(challenge)}
        </Text>
        {shouldShowProgressLabel ? (
          <View style={styles.progressLabel}>
            <IconCheck
              style={styles.iconCheck}
              fill={neutralLight4}
              width={20}
              height={20}
            />
            <Text style={styles.progress}>{formattedProgressLabel}</Text>
          </View>
        ) : null}
        {shouldShowProgressBar ? (
          <View>
            <ProgressBar
              progress={challenge?.current_step_count ?? 0}
              max={maxStepCount}
            />
          </View>
        ) : null}
        {
          <Button
            fullWidth
            variant='secondary'
            iconRight={hasDisbursed ? undefined : IconArrowRight}
            onPress={onPress}
            style={styles.button}
            size='small'
          >
            {buttonMessage}
          </Button>
        }
      </View>
    </TouchableOpacity>
  )
}
