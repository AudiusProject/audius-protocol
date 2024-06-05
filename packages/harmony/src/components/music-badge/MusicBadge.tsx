import { Text } from '../text/Text'
import { Flex } from '../layout/Flex'
import { ReactNode } from 'react'

export enum MusicBadgeSize {
  SMALL = 's',
  DEFAULT = 'm'
}

export type MusicBadgeProps = {
  textLabel: string
  icon?: ReactNode
  size?: 's' | 'm'
}

export const MusicBadge = (props: MusicBadgeProps) => {
  const {
    textLabel,
    icon: IconComponent,
    size = MusicBadgeSize.DEFAULT
  } = props

  const gap = size === MusicBadgeSize.DEFAULT ? 's' : 'xs'
  const textSize = size === MusicBadgeSize.DEFAULT ? 'm' : 's'

  return (
    <Flex
      alignItems='center'
      justifyContent='center'
      borderRadius='xs'
      border='strong'
      gap={gap}
    >
      {IconComponent}
      <Text variant='label' size={textSize} textTransform='uppercase'>
        {textLabel}
      </Text>
    </Flex>
  )
}
