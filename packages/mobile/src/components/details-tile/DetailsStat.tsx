import React from 'react'

import { Pressable } from 'react-native'

import type { IconComponent } from '@audius/harmony-native'
import { Flex, Text } from '@audius/harmony-native'
import { formatCount } from 'app/utils/format'

type DetailsTileStatProps = {
  count: number
  onPress?: () => void
  label: string
  icon: IconComponent
  size?: number
}

export const DetailsTileStat = ({
  count,
  onPress,
  icon: Icon,
  label
}: DetailsTileStatProps) => {
  return (
    <Pressable onPress={onPress}>
      <Text>
        <Flex direction='row' gap='xs' alignItems='center'>
          <Icon color='default' size='s' />
          <Text variant='label' size='m' textTransform='capitalize'>
            {formatCount(count)}
          </Text>
          <Text variant='label' size='m' textTransform='capitalize'>
            {label}
          </Text>
        </Flex>
      </Text>
    </Pressable>
  )
}
