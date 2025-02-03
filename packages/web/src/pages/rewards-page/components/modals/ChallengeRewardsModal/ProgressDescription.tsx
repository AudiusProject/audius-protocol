import { ReactNode } from 'react'

import { Flex, Text } from '@audius/harmony'

/** Renders the description section for an audio challenge modal. A default label
 * is rendered if none is provided.
 */
export const ProgressDescription = ({
  description
}: {
  description: ReactNode
}) => {
  return (
    <Flex column gap='m' p='xl'>
      <Text variant='body'>{description}</Text>
    </Flex>
  )
}
