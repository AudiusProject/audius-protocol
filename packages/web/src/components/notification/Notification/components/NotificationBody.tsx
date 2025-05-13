import { ReactNode } from 'react'

import { Text } from '@audius/harmony'

type NotificationBodyProps = {
  className?: string
  children: ReactNode
}

export const NotificationBody = (props: NotificationBodyProps) => {
  const { className, children } = props

  return (
    <div>
      <Text variant='body' size='l' lineHeight='multi' className={className}>
        {children}
      </Text>
    </div>
  )
}
