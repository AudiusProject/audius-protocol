import { useFormattedUSDCBalance } from '@audius/common/hooks'
import { walletMessages } from '@audius/common/messages'

import { Flex, Text, spacing, IconTokenUSDC } from '@audius/harmony-native'
import Skeleton from 'app/components/skeleton'

export const CashBalanceSection = () => {
  const { balanceFormatted, isLoading } = useFormattedUSDCBalance()

  return (
    <Flex direction='column' gap='xs'>
      <Flex direction='row' alignItems='center' gap='s'>
        <IconTokenUSDC height={spacing.unit6} width={spacing.unit6} />
        <Text variant='heading' color='subdued' size='s'>
          {walletMessages.cashBalance}
        </Text>
      </Flex>
      {isLoading ? (
        <Skeleton
          height={spacing.unit14}
          width={spacing.unit24}
          style={{ marginTop: spacing.unit4 }}
        />
      ) : (
        <Text variant='display'>{balanceFormatted}</Text>
      )}
    </Flex>
  )
}
