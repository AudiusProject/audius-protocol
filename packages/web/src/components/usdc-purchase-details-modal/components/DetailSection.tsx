import { Flex, Text } from '@audius/harmony'

import React from 'react'

export const DetailSection = ({
  children,
  label,
  button
}: {
  children?: React.ReactNode
  label: string | React.ReactNode
  button?: React.ReactNode
}) => (
  <Flex
    w='100%'
    alignItems={button ? undefined : 'center'}
    css={{ overflow: 'hidden' }}
  >
    <Flex gap='s' direction='column' w='100%'>
      <Text variant='label' size='l' color='subdued'>
        {label}
      </Text>
      {children}
    </Flex>
    {button}
  </Flex>
)
