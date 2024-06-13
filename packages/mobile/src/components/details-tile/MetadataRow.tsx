import type { PropsWithChildren } from 'react'

import { Flex, Text } from '@audius/harmony-native'

type MetadataRowProps = PropsWithChildren<{
  label: string
}>

export const MetadataRow = ({ label, children }: MetadataRowProps) => {
  return (
    <Flex direction='row' alignItems='center' key={label} gap='xs'>
      <Text variant='label'>{label}</Text>
      <Text variant='body' size='s' strength='strong'>
        {children}
      </Text>
    </Flex>
  )
}
