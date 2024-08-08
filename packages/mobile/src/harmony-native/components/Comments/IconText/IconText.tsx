import { Flex, Text } from '../..'

import type { IconTextProps } from './types'

export const IconText = ({
  children,
  color = 'default',
  icons = []
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
    <Flex direction='row' h='l' gap='xs' alignItems='center'>
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
