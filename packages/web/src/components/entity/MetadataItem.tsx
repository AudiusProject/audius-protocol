import { PropsWithChildren } from 'react'

import { Flex, Text } from '@audius/harmony'

type MetadataItemProps = PropsWithChildren<{
  label: string
}>

export const MetadataItem = ({ label, children }: MetadataItemProps) => {
  return (
    <Flex direction='row' alignItems='center' gap='xs'>
      <Text tag='dt' variant='label' color='subdued'>
        {label}
      </Text>
      <Text tag='dd' variant='body' size='s' strength='strong'>
        {children}
      </Text>
    </Flex>
  )
}
