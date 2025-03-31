import type { ReactNode } from 'react'

import { Skeleton } from '../Skeleton'
import { Text } from '../Text/Text'
import { Flex } from '../layout/Flex/Flex'
type BalancePillProps = {
  balance: string
  icon: ReactNode
  isLoading: boolean
}

/**
 * A pill that displays a balance with an icon.
 */
export const BalancePill = (props: BalancePillProps) => {
  const { balance, icon, isLoading } = props

  return (
    <Flex
      row
      alignItems='center'
      gap='xs'
      p='unitHalf'
      pl='s'
      border='default'
      borderRadius='circle'
      backgroundColor='surface1'
    >
      {isLoading ? (
        <Flex h='unit4' w='unit6'>
          <Skeleton />
        </Flex>
      ) : (
        // TODO: Fix this 1 pixel padding bug PAY-3780
        <Flex pt={1}>
          <Text variant='label' color='inverse'>
            {balance}
          </Text>
        </Flex>
      )}
      <Flex>{icon}</Flex>
    </Flex>
  )
}
