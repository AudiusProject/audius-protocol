import type { TextProps } from 'app/components/core'
import { Text } from 'app/components/core'

type NotificationTextProps = TextProps

export const NotificationText = (props: NotificationTextProps) => {
  const { children, style, ...other } = props

  return (
    <Text
      fontSize='large'
      style={[
        {
          lineHeight: 27,
          flex: 1
        },
        style
      ]}
      {...other}>
      {children}
    </Text>
  )
}
