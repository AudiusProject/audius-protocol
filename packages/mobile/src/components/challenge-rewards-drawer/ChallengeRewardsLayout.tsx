import React from 'react'
import type { ReactNode } from 'react'

import { ScrollView } from 'react-native-gesture-handler'

import { Text, Flex } from '@audius/harmony-native'
import { ProgressBar } from 'app/components/progress-bar'

import { ChallengeDescription } from './ChallengeDescription'
import { ChallengeReward } from './ChallengeReward'
import { useStyles } from './styles'

const messages = {
  progressLabel: 'Progress'
}

type ChallengeRewardsLayoutProps = {
  /** The description component or content */
  description: ReactNode
  /** Optional additional description */
  optionalDescription?: string
  /** The amount of $AUDIO that is rewarded */
  amount?: number | null
  /** The reward subtext (e.g. "$AUDIO") */
  rewardSubtext?: string
  /** Whether to show the progress bar */
  showProgressBar?: boolean
  /** Current progress value */
  progressValue?: number | null
  /** Maximum progress value */
  progressMax?: number | null
  /** Status label component */
  statusLabel: ReactNode
  /** Additional content to render */
  additionalContent?: ReactNode
  /** Error content to display */
  errorContent?: ReactNode
  /** The claim button or other action component */
  actions: ReactNode
  /** Whether this is a cooldown challenge */
  isCooldownChallenge?: boolean
}

export const ChallengeRewardsLayout = ({
  description,
  optionalDescription,
  amount,
  rewardSubtext = '$AUDIO',
  showProgressBar,
  progressValue,
  progressMax,
  statusLabel,
  additionalContent,
  errorContent,
  actions,
  isCooldownChallenge
}: ChallengeRewardsLayoutProps) => {
  const styles = useStyles()

  return (
    <>
      <ScrollView style={styles.content}>
        <ChallengeDescription
          description={description}
          optionalDescription={optionalDescription}
          isCooldownChallenge={isCooldownChallenge}
        />
        <Flex alignItems='center' gap='3xl' w='100%'>
          <Flex row alignItems='center' gap='xl'>
            <ChallengeReward amount={amount ?? 0} subtext={rewardSubtext} />
            {showProgressBar &&
            progressValue !== undefined &&
            progressValue !== null &&
            progressMax !== undefined &&
            progressMax !== null ? (
              <Flex style={styles.progressCell}>
                <Text
                  color='subdued'
                  style={[styles.subheader, styles.progressSubheader]}
                  strength='strong'
                  textTransform='uppercase'
                  variant='label'
                  size='l'
                >
                  {messages.progressLabel}
                </Text>
                <ProgressBar progress={progressValue} max={progressMax} />
              </Flex>
            ) : null}
          </Flex>
          {statusLabel}
          {additionalContent}
        </Flex>
      </ScrollView>
      <Flex w='100%' ph='l' pv='m' gap='l'>
        {errorContent}
        {actions}
      </Flex>
    </>
  )
}
