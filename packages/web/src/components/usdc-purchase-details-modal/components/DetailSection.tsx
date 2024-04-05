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
    justifyContent='space-between'
    w='100%'
    alignItems={button ? undefined : 'center'}
  >
    <Flex gap='s' direction='column'>
      <Text variant='label' size='l' color='subdued'>
        {label}
      </Text>
      {children}
    </Flex>
    {button}
  </Flex>
)
