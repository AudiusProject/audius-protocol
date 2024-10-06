import { useState } from 'react'

import { Pressable } from 'react-native'

import type { IconComponent } from '@audius/harmony-native'
import { useTheme, IconPaperAirplane } from '@audius/harmony-native'

import type { SendIconProps } from './types'

export const SendIcon = ({ disabled = false, onPress }: SendIconProps) => {
  const [isPressed, setIsPressed] = useState(false)
  const Icon: IconComponent = IconPaperAirplane
  const { color } = useTheme()

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
    >
      <Icon
        fill={isPressed ? color.primary.p500 : color.primary.primary}
        size='2xl'
        opacity={disabled ? 0.5 : 1}
      />
    </Pressable>
  )
}
