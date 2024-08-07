import type { IconTextProps } from '@audius/harmony/src/components/comments/IconText/types'

import { Flex, Text } from '../..'

export const IconText = ({
  icons = [],
  text,
  color = 'default'
}: IconTextProps) => {
  const separator = (
    <Text
      variant='body'
      color='default'
      style={{ fontSize: 8, lineHeight: 16 }}
    >
      •
    </Text>
  )

  return (
    <Flex direction='row' h={16} gap='xs' alignItems='center'>
      {icons.map(({ icon: Icon, color: iconColor = 'default' }, idx) => (
        <>
          {idx > 0 ? separator : null}
          <Icon key={`icon${idx}`} size='2xs' color={iconColor} />
        </>
      ))}
      <Text variant='body' size='xs' color={color}>
        {text}
      </Text>
    </Flex>
  )
}
