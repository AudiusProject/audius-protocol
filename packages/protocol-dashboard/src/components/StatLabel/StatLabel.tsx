import { PropsWithChildren } from 'react'

import { Text, TextProps } from '@audius/harmony'

type StatLabelProps = PropsWithChildren<{
  size?: TextProps['size']
  variant?: TextProps['variant']
  strength?: TextProps['strength']
}>

export const StatLabel = ({
  size,
  strength,
  variant,
  children
}: StatLabelProps) => {
  return (
    <Text
      size={size ?? 'l'}
      strength={strength ?? 'default'}
      variant={variant ?? 'title'}
    >
      {children}
    </Text>
  )
}
