import type { TextProps } from 'app/components/core'
import { Text } from 'app/components/core'

type NotificationTitleProps = TextProps

export const NotificationTitle = (props: NotificationTitleProps) => {
  return (
    <Text variant='h1' color='secondary' weight='bold' noGutter {...props} />
  )
}
