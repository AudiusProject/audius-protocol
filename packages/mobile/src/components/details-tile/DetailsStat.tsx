import React from 'react'

import type { IconComponent } from '@audius/harmony-native'
import { Text, Flex, PlainButton } from '@audius/harmony-native'
import { formatCount } from 'app/utils/format'

type DetailsTileStatProps = {
  count: number
  onPress?: () => void
  label?: string
  icon: IconComponent
  size?: number
}

export const DetailsTileStat = ({
  count,
  onPress,
  icon: Icon,
  label: labelProp
}: DetailsTileStatProps) => {
  const label = `${formatCount(count)}` + `${labelProp ? ` ${labelProp}` : ''}`

  if (onPress)
    return (
      <PlainButton onPress={onPress} iconLeft={Icon}>
        {label}
      </PlainButton>
    )

  return (
    <Flex direction='row' gap='xs' alignItems='center'>
      <Icon size='s' color='default' />
      <Text variant='label'>{label}</Text>
    </Flex>
  )
}
