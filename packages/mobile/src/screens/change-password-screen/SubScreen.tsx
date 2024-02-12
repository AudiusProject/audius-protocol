import type { ReactNode } from 'react'

import { Flex } from '@audius/harmony-native'

export const SubScreen = ({ children }: { children: ReactNode }) => {
  return (
    <Flex
      direction='column'
      gap='xl'
      ph='l'
      pv='xl'
      backgroundColor='white'
      style={{ flexGrow: 1 }}
    >
      {children}
    </Flex>
  )
}
