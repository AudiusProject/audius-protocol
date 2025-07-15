import { ReactNode } from 'react'

import { Flex } from '@audius/harmony'

type NotificationHeaderProps = {
  icon: ReactNode
  children: ReactNode
}

export const NotificationHeader = (props: NotificationHeaderProps) => {
  const { icon, children } = props
  return (
    <Flex alignItems='center' w='100%' pb='l' borderBottom='default' gap='s'>
      {icon}
      {children}
    </Flex>
  )
}
