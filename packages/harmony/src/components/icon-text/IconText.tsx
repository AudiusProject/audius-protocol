import { Flex } from 'components/layout'
import { Text } from 'components/text'

import { IconTextProps } from './types'

export const IconText = ({
  children,
  color = 'default',
  icons = []
}: IconTextProps) => {
  const separator = (
    <Text variant='body' color='default' css={{ fontSize: 8 }}>
      •
    </Text>
  )

  return (
    <Flex h='l' gap='xs' alignItems='center'>
      {icons.map(({ icon: Icon, color: iconColor = 'default' }, index) => (
        <>
          {index > 0 ? separator : null}
          <Icon key={`icon${index}`} size='2xs' color={iconColor} />
        </>
      ))}
      <Text variant='body' size='xs' color={color}>
        {children}
      </Text>
    </Flex>
  )
}
