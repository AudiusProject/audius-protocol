import { ReactNode } from 'react'

import { Flex, Text } from '@audius/harmony'

export type HoverCardBodyProps = {
  icon: ReactNode
  amount: string
  currency?: string
}

export const HoverCardBody = ({
  icon,
  amount,
  currency = '$AUDIO'
}: HoverCardBodyProps) => {
  return (
    <Flex w='100%' p='s' column justifyContent='center'>
      <Flex gap='s' alignItems='center'>
        <Flex>{icon}</Flex>
        <Flex column justifyContent='center'>
          <Flex alignItems='center' gap='xs'>
            <Text variant='heading' size='m'>
              {amount}
            </Text>
            <Text variant='heading' size='m' color='subdued'>
              {currency}
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
}
