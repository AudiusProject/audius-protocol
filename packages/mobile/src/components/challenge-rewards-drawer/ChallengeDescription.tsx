import type { ReactNode } from 'react'

import { View } from 'react-native'

import { Flex } from '@audius/harmony-native'
import { Text } from 'app/components/core'

import { useStyles } from './styles'
const messages = {
  task: 'Task Details',
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
  /** Optional icon to render next to the task label */
  taskIcon?: ReactNode
  /** Optional override for the task label. Defaults to a Text node of 'Task Details' */
  task?: ReactNode
} & DescriptionContent

/** Renders the task description for the challenge. Pass `description` to render
 * a simple text string or use `renderDescription` to render fully customized
 * content.
 */
export const ChallengeDescription = ({
  taskIcon,
  task = messages.task,
  description,
  renderDescription
}: ChallengeDescriptionProps) => {
  const styles = useStyles()
  return (
    <View style={styles.task}>
      <View style={styles.taskHeader}>
        {taskIcon}
        <Text
          variant='body'
          fontSize='medium'
          style={styles.subheader}
          weight='heavy'
          textTransform='uppercase'
        >
          {task}
        </Text>
      </View>
      {renderDescription ? (
        renderDescription()
      ) : (
        <Flex gap='m' mb='l'>
          <Text variant='body'>{description}</Text>
          <Text variant='body' color='neutralLight4'>
            {messages.cooldownDescription}
          </Text>
        </Flex>
      )}
    </View>
  )
}
