import { PropsWithChildren } from 'react'

import { Flex } from '@audius/harmony'

export const SignOnContainerMobile = ({ children }: PropsWithChildren<{}>) => {
  return (
    <Flex direction='column' h='100%' css={{ overflow: 'hidden' }}>
      {children}
    </Flex>
  )
}
