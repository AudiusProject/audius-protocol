import { useUSDCBalance } from '@audius/common/hooks'
import type { BNUSDC } from '@audius/common/models'
import { USDC } from '@audius/fixed-decimal'

import { Flex, Text } from '@audius/harmony-native'
import LogoUSDC from 'app/assets/images/logoUSDC.svg'
import Skeleton from 'app/components/skeleton'
import { spacing } from 'app/styles/spacing'

const messages = {
  cashBalance: 'Cash Balance',
  balance: (balance: BNUSDC) =>
    `$${USDC(balance).toLocaleString('en-US', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    })}`
}

export const CashBalanceSection = () => {
  const { data: usdcBalance } = useUSDCBalance({
    isPolling: true,
    commitment: 'confirmed'
  })
  const isLoading = usdcBalance === null

  return (
    <Flex direction='column' gap='xs'>
      <Flex direction='row' alignItems='center' gap='s'>
        <LogoUSDC height={spacing(6)} width={spacing(6)} />
        <Text variant='heading' color='subdued' size='s'>
          {messages.cashBalance}
        </Text>
      </Flex>
      {isLoading ? (
        <Skeleton height={spacing(6)} width={spacing(16)} />
      ) : (
        <Text variant='display'>{messages.balance(usdcBalance)}</Text>
      )}
    </Flex>
  )
}
