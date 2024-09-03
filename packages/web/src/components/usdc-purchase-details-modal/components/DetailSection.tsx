import React from 'react'

import { Flex, Text } from '@audius/harmony'

export const DetailSection = ({
  children,
  label,
  actionButton
}: {
  children?: React.ReactNode
  label: string | React.ReactNode
  actionButton?: React.ReactNode
}) => (
  <Flex
    w='100%'
    alignItems={actionButton ? undefined : 'center'}
    css={{ overflow: 'hidden' }}
  >
    <Flex gap='s' direction='column' w='100%' p='s'>
      <Text variant='label' size='l' color='subdued'>
        {label}
      </Text>
      {children}
    </Flex>
    {actionButton}
  </Flex>
)
