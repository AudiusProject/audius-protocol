import type { IconColors, IconComponent } from '@audius/harmony'
import { Flex, Text } from '@audius/harmony'

type LineupTileLabelProps = {
  icon?: IconComponent
  children: string
  color?: IconColors
}

export const LineupTileLabel = (props: LineupTileLabelProps) => {
  const { icon: Icon, children, color = 'subdued' } = props
  return (
    <Flex gap='xs' alignItems='center'>
      {Icon ? <Icon color={color} size='s' /> : null}
      <Text size='xs' color={color} ellipses>
        {children}
      </Text>
    </Flex>
  )
}
