import type { ReactNode } from 'react'
import React from 'react'

import { Flex, Text, Skeleton } from '@audius/harmony-native'

interface ExploreSectionProps {
  title: string
  isLoading?: boolean
  centered?: boolean
  children: ReactNode
}

export const ExploreSection = ({
  title,
  isLoading,
  centered,
  children
}: ExploreSectionProps) => {
  return (
    <Flex mb='l' justifyContent={centered ? 'center' : 'flex-start'} gap='m'>
      <Text variant='title' size='l' textAlign={centered ? 'center' : 'left'}>
        {title}
      </Text>
      {isLoading ? (
        <Flex h={260} w='100%'>
          <Skeleton noShimmer />
        </Flex>
      ) : (
        children
      )}
    </Flex>
  )
}
