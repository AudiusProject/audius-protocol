import { buySellMessages as baseMessages } from '@audius/common/messages'
import { formatNumberCommas } from '@audius/common/utils'
import { Button, Flex, Text } from '@audius/harmony'

import { CryptoBalanceSection } from './CryptoBalanceSection'
import { USDCBalanceSection } from './USDCBalanceSection'
import { TokenInfo } from './types'

// Helper function to format currency (assuming USD)
const formatCurrency = (amount: number) => {
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD'
  })
}

// Helper function to format token amounts based on whether it's a stablecoin
const formatTokenAmount = (amount: number, tokenInfo: TokenInfo) => {
  const formatted = formatNumberCommas(amount.toFixed(2)) // Basic formatting
  if (tokenInfo.isStablecoin) {
    return formatCurrency(amount)
  }
  return formatted
}

const messages = {
  ...baseMessages,
  priceEach: (price: number) => `(${formatCurrency(price)} ea.)`
}

type ConfirmSwapScreenProps = {
  payTokenInfo: TokenInfo
  receiveTokenInfo: TokenInfo
  payAmount: number
  receiveAmount: number
  pricePerBaseToken: number
  baseTokenSymbol: string
  onBack: () => void
  onConfirm: () => void
  isConfirming: boolean
}

export const ConfirmSwapScreen = (props: ConfirmSwapScreenProps) => {
  const {
    payTokenInfo,
    receiveTokenInfo,
    payAmount,
    receiveAmount,
    pricePerBaseToken,
    baseTokenSymbol,
    onBack,
    onConfirm,
    isConfirming
  } = props

  const formattedPayAmount = formatTokenAmount(payAmount, payTokenInfo)
  const formattedReceiveAmount = formatTokenAmount(
    receiveAmount,
    receiveTokenInfo
  )

  const isReceivingBaseToken = receiveTokenInfo.symbol === baseTokenSymbol
  const priceLabel = isReceivingBaseToken
    ? messages.priceEach(pricePerBaseToken)
    : undefined

  return (
    <Flex direction='column' gap='l'>
      <Text variant='body' size='m' textAlign='center'>
        {messages.confirmReview}
      </Text>
      <Flex direction='column' gap='xl'>
        {payTokenInfo.symbol === 'USDC' ? (
          <USDCBalanceSection
            title={messages.youPay}
            tokenInfo={payTokenInfo}
            amount={formattedPayAmount}
          />
        ) : (
          <CryptoBalanceSection
            title={messages.youPay}
            tokenInfo={payTokenInfo}
            amount={formattedPayAmount}
          />
        )}
        {receiveTokenInfo.symbol === 'USDC' ? (
          <USDCBalanceSection
            title={messages.youReceive}
            tokenInfo={receiveTokenInfo}
            amount={formattedReceiveAmount}
          />
        ) : (
          <CryptoBalanceSection
            title={messages.youReceive}
            tokenInfo={receiveTokenInfo}
            amount={formattedReceiveAmount}
            priceLabel={priceLabel}
          />
        )}
      </Flex>

      <Flex gap='s' mt='xl'>
        <Button variant='secondary' fullWidth onClick={onBack}>
          {messages.back}
        </Button>
        <Button
          variant='primary'
          fullWidth
          onClick={onConfirm}
          isLoading={isConfirming}
        >
          {messages.confirm}
        </Button>
      </Flex>
    </Flex>
  )
}
