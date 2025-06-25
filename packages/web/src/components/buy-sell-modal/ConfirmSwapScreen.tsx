import { useMemo } from 'react'

import { formatUSDCValue, SLIPPAGE_BPS } from '@audius/common/api'
import { useBuySellAnalytics } from '@audius/common/hooks'
import { buySellMessages as baseMessages } from '@audius/common/messages'
import { TokenInfo, getSwapTokens, TokenPair } from '@audius/common/store'
import { Button, Flex, Text } from '@audius/harmony'

import { SwapBalanceSection } from './SwapBalanceSection'
import { useTokenAmountFormatting } from './hooks/useTokenAmountFormatting'

const messages = {
  ...baseMessages,
  priceEach: (price: number) => {
    const formatted = formatUSDCValue(price, { includeDollarSign: true })
    return `(${formatted} ea.)`
  }
}

type ConfirmSwapScreenProps = {
  payTokenInfo: TokenInfo
  receiveTokenInfo: TokenInfo
  payAmount: number
  receiveAmount: number
  pricePerBaseToken: number
  baseTokenSymbol: string
  exchangeRate?: number | null
  onBack: () => void
  onConfirm: () => void
  isConfirming: boolean
  activeTab: 'buy' | 'sell'
  selectedPair: TokenPair
}

export const ConfirmSwapScreen = (props: ConfirmSwapScreenProps) => {
  const {
    payTokenInfo,
    receiveTokenInfo,
    payAmount,
    receiveAmount,
    pricePerBaseToken,
    baseTokenSymbol,
    exchangeRate,
    onBack,
    onConfirm,
    isConfirming,
    activeTab,
    selectedPair
  } = props

  const { trackSwapConfirmed } = useBuySellAnalytics()

  // Memoize swap tokens to avoid repeated calculations
  const swapTokens = useMemo(
    () => getSwapTokens(activeTab, selectedPair),
    [activeTab, selectedPair]
  )

  // balance isn't needed so we pass 0
  const { formattedAmount: formattedPayAmount } = useTokenAmountFormatting({
    amount: payAmount,
    availableBalance: 0,
    isStablecoin: !!payTokenInfo.isStablecoin
  })

  const { formattedAmount: formattedReceiveAmount } = useTokenAmountFormatting({
    amount: receiveAmount,
    availableBalance: 0,
    isStablecoin: !!receiveTokenInfo.isStablecoin
  })

  const isReceivingBaseToken = receiveTokenInfo.symbol === baseTokenSymbol
  const priceLabel = isReceivingBaseToken
    ? messages.priceEach(pricePerBaseToken)
    : undefined

  const handleConfirm = () => {
    // Track swap confirmed
    trackSwapConfirmed({
      activeTab,
      inputToken: swapTokens.inputToken,
      outputToken: swapTokens.outputToken,
      inputAmount: payAmount,
      outputAmount: receiveAmount,
      exchangeRate,
      slippageBps: SLIPPAGE_BPS
    })

    onConfirm()
  }

  if (!formattedPayAmount || !formattedReceiveAmount) {
    return null
  }

  return (
    <Flex direction='column' gap='l'>
      <Text variant='body' size='m' textAlign='center'>
        {messages.confirmReview}
      </Text>
      <Flex direction='column' gap='xl'>
        <SwapBalanceSection
          title={messages.youPay}
          tokenInfo={payTokenInfo}
          amount={formattedPayAmount}
        />
        <SwapBalanceSection
          title={messages.youReceive}
          tokenInfo={receiveTokenInfo}
          amount={formattedReceiveAmount}
          priceLabel={priceLabel}
        />
      </Flex>

      <Flex gap='s' mt='xl'>
        <Button variant='secondary' fullWidth onClick={onBack}>
          {messages.back}
        </Button>
        <Button
          variant='primary'
          fullWidth
          onClick={handleConfirm}
          isLoading={isConfirming}
        >
          {messages.confirm}
        </Button>
      </Flex>
    </Flex>
  )
}
