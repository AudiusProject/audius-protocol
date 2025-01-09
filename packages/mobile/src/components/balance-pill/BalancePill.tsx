import type { ReactNode } from 'react'

import { Flex, Text } from '@audius/harmony-native'
import Skeleton from 'app/components/skeleton'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'

const useStyles = makeStyles(({ spacing, palette }) => ({
  amount: {
    paddingRight: spacing(1.5),
    paddingVertical: spacing(0.5)
  }
}))

type BalancePillProps = {
  balance: string
  icon: ReactNode
  isLoading: boolean
}

export const BalancePill = (props: BalancePillProps) => {
  const { balance, icon, isLoading } = props
  const styles = useStyles()

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
        <Skeleton
          style={styles.amount}
          height={spacing(4.5)}
          width={spacing(6)}
        />
      ) : (
        <Text variant='label' color='inverse'>
          {balance}
        </Text>
      )}
      <Flex>{icon}</Flex>
    </Flex>
  )
}
