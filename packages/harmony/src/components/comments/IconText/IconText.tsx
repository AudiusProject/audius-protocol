import { Flex } from 'components/layout'
import { Text } from 'components/text'

import { IconTextProps } from './types'

export const IconText = ({
  icons = [],
  text,
  color = 'default'
}: IconTextProps) => {
  const separator = (
    <Text variant='body' color='default' css={{ fontSize: 8 }}>
      •
    </Text>
  )

  return (
    <Flex h={16} gap='xs' alignItems='center'>
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
