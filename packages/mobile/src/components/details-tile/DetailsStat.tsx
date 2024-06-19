import React from 'react'

import type { IconComponent } from '@audius/harmony-native'
import { PlainButton } from '@audius/harmony-native'
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
    <PlainButton onPress={onPress} iconLeft={Icon}>{`${formatCount(
      count
    )} ${label}`}</PlainButton>
  )
}
