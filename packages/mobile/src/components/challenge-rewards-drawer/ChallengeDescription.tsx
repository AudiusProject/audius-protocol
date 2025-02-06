import type { ReactNode } from 'react'

import { View } from 'react-native'

import { Flex, Text } from '@audius/harmony-native'

import { useStyles } from './styles'
const messages = {
  cooldownDescription:
    'Note: There is a 7 day waiting period from completion until you can claim your reward.'
}

type DescriptionContent =
  | {
      description?: never
      renderDescription: () => ReactNode
    }
  | { description: ReactNode; renderDescription?: never }

type ChallengeDescriptionProps = {
  /** Indicates if the challenge has a cooldown period */
  isCooldownChallenge?: boolean
} & DescriptionContent

/** Renders the task description for the challenge. Pass `description` to render
 * a simple text string or use `renderDescription` to render fully customized
 * content.
 */
export const ChallengeDescription = ({
  description,
  renderDescription,
  isCooldownChallenge = true
}: ChallengeDescriptionProps) => {
  const styles = useStyles()
  return (
    <View style={styles.task}>
      {renderDescription ? (
        renderDescription()
      ) : (
        <Flex gap='m' mb='l'>
          <Text variant='body' size='l'>
            {description}
          </Text>
          {isCooldownChallenge ? (
            <Text variant='body' color='subdued'>
              {messages.cooldownDescription}
            </Text>
          ) : null}
        </Flex>
      )}
    </View>
  )
}
