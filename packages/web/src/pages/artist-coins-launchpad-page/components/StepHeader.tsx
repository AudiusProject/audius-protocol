import { Flex, Text } from '@audius/harmony'

import type { StepHeaderProps } from './types'

export const StepHeader = ({ stepInfo, title, description }: StepHeaderProps) => {
  return (
    <Flex direction='column' gap='xs' alignItems='flex-start'>
      <Text variant='label' size='s' color='subdued'>
        {stepInfo}
      </Text>
      <Text variant='heading' size='l' color='default'>
        {title}
      </Text>
      <Text variant='body' size='l' color='subdued'>
        {description}
      </Text>
    </Flex>
  )
}
