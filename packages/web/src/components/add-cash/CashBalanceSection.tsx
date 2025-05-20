import { BNUSDC } from '@audius/common/models'
import { USDC } from '@audius/fixed-decimal'
import { Box, Flex, IconLogoCircleUSDC, Text } from '@audius/harmony'
import { BN } from 'bn.js'

const messages = {
  cashBalance: 'Cash Balance'
}

type CashBalanceSectionProps = {
  balance: BNUSDC | null
}

export const CashBalanceSection = ({ balance }: CashBalanceSectionProps) => {
  const formattedBalance = USDC(balance ?? new BN(0)).value

  return (
    <Flex column gap='s'>
      <Flex alignItems='center' justifyContent='space-between'>
        <Flex alignItems='center'>
          <IconLogoCircleUSDC />
          <Box pl='s'>
            <Text variant='heading' size='s' color='subdued'>
              {messages.cashBalance}
            </Text>
          </Box>
        </Flex>
      </Flex>
      <Text variant='display'>{USDC(formattedBalance).toLocaleString()}</Text>
    </Flex>
  )
}
