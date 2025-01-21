import { useFormattedProgressLabel } from '@audius/common/hooks'
import type { OptimisticUserChallenge } from '@audius/common/models'
import type { ChallengeRewardsInfo } from '@audius/common/utils'
import { isAudioMatchingChallenge } from '@audius/common/utils'
import { TouchableOpacity } from 'react-native-gesture-handler'

import {
  IconCheck,
  Text,
  Flex,
  useTheme,
  IconSparkles
} from '@audius/harmony-native'
import { ProgressBar } from 'app/components/progress-bar'
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

type PanelProps = {
  onPress: () => void
  challenge?: OptimisticUserChallenge
} & ChallengeRewardsInfo &
  MobileChallengeConfig

export const Panel = ({
  id,
  onPress,
  title,
  shortDescription,
  description,
  progressLabel,
  remainingLabel,
  challenge
}: PanelProps) => {
  const { spacing } = useTheme()
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
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Flex border='default' borderRadius='l' pb='unit10'>
        <Flex row justifyContent='flex-end' m='s' h={spacing.unit6}>
          {needsDisbursement ? (
            <Flex
              row
              alignItems='center'
              ph='s'
              borderRadius='circle'
              backgroundColor='default'
              border='default'
            >
              <Text size='s' strength='strong' color='accent'>
                {messages.readyToClaim}
              </Text>
            </Flex>
          ) : showNewChallengePill ? (
            <Flex
              row
              alignItems='center'
              gap='xs'
              ph='s'
              backgroundColor='primary'
              borderRadius='circle'
            >
              <IconSparkles color='staticWhite' size='xs' />
              <Text size='s' strength='strong' color='staticWhite'>
                {messages.new}
              </Text>
            </Flex>
          ) : null}
        </Flex>
        <Flex ph='unit5' gap='s'>
          <Text variant='heading' size='s'>
            {title}
          </Text>
          <Text>{shortDescription || description(challenge)}</Text>
          <Flex mt='l' gap='l'>
            {shouldShowProgressLabel ? (
              <Flex row alignItems='center' gap='xs'>
                {hasDisbursed ? (
                  <IconCheck fill={neutralLight4} size='s' />
                ) : null}
                <Flex row alignItems='center'>
                  <Text variant='label' size='l' color='subdued'>
                    {formattedProgressLabel}
                  </Text>
                </Flex>
              </Flex>
            ) : null}
            {shouldShowProgressBar ? (
              <ProgressBar
                progress={challenge?.current_step_count ?? 0}
                max={maxStepCount}
              />
            ) : null}
          </Flex>
        </Flex>
      </Flex>
    </TouchableOpacity>
  )
}
