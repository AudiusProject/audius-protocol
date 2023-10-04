import type { TextProps } from 'app/components/core'
import { Text } from 'app/components/core'

type ErrorTextProps = TextProps

export const ErrorText = (props: ErrorTextProps) => {
  return (
    <Text
      fontSize='medium'
      weight='demiBold'
      color='error'
      style={{
        // Ensure that word wrapping occurs
        flexShrink: 1
      }}
      {...props}
    />
  )
}
