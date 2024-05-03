import type { PropsWithChildren } from 'react'

import Color from 'color'
import type { TouchableOpacityProps } from 'react-native-gesture-handler'
import { TouchableOpacity } from 'react-native-gesture-handler'

import { IconRobot, Text, Flex, Button } from '@audius/harmony-native'

type DetailsTileBadgeProps = PropsWithChildren<
  Pick<TouchableOpacityProps, 'onPress'> & {
    color: string
  }
>

export const DetailsTileBadge = (props: DetailsTileBadgeProps) => {
  const { children, color, onPress } = props

  const rootStyles = {
    borderWidth: 1,
    borderStyle: 'solid' as const,
    borderColor: new Color(color).fade(0.5).string(),
    backgroundColor: new Color(color).fade(0.8).string()
  }

  return (
    <TouchableOpacity onPress={onPress}>
      <Flex
        as={Button}
        direction='row'
        gap='xs'
        ph='s'
        pv='xs'
        borderRadius='s'
        alignItems='center'
        style={rootStyles}
      >
        <IconRobot size='s' fill={color} />
        <Text variant='label' size='s' style={{ color }}>
          {children}
        </Text>
      </Flex>
    </TouchableOpacity>
  )
}
