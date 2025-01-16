import { ReactNode } from 'react'

import { Flex, Text } from '@audius/harmony'

const messages = {
  task: 'Task'
}

/** Renders the description section for an audio challenge modal. A default label
 * is rendered if none is provided.
 */
export const ProgressDescription = ({
  description,
  label = messages.task
}: {
  label?: ReactNode
  description: ReactNode
}) => {
  return (
    <Flex>
      <Flex column gap='m' p='xl'>
        <Text variant='label' size='l' strength='strong' color='subdued'>
          {label}
        </Text>
        <Text variant='body'>{description}</Text>
      </Flex>
    </Flex>
  )
}
