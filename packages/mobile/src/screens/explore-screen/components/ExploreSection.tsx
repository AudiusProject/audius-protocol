import type { ReactNode } from 'react'
import React from 'react'

import { Flex, Text, Skeleton, PlainButton } from '@audius/harmony-native'
import { useNavigation } from 'app/hooks/useNavigation'

const messages = {
  viewAll: 'View All'
}

interface ExploreSectionProps {
  title: string
  isLoading?: boolean
  centered?: boolean
  children: ReactNode
  viewAllLink?: string
}

export const ExploreSection = ({
  title,
  isLoading,
  centered,
  children,
  viewAllLink
}: ExploreSectionProps) => {
  const navigation = useNavigation()
  return (
    <Flex justifyContent={centered ? 'center' : 'flex-start'} gap='m'>
      <Flex row gap='l' alignItems='center' justifyContent='space-between'>
        <Text variant='title' size='l' textAlign={centered ? 'center' : 'left'}>
          {title}
        </Text>
        {viewAllLink && (
          <PlainButton
            onPress={() => {
              navigation.push(viewAllLink)
            }}
          >
            {messages.viewAll}
          </PlainButton>
        )}
      </Flex>

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
