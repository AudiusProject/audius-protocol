import type { ReactNode } from 'react'
import React from 'react'

import { Flex, Text, Skeleton } from '@audius/harmony-native'

interface ExploreSectionProps {
  title: string
  isLoading?: boolean
  children: ReactNode
}

export const ExploreSection = ({
  title,
  isLoading,
  children
}: ExploreSectionProps) => {
  return (
    <Flex mb='l'>
      <Text variant='title' size='l'>
        {title}
      </Text>
      {isLoading ? (
        <Skeleton style={{ height: 180, width: '100%' }} />
      ) : (
        children
      )}
    </Flex>
  )
}
