import { buySellMessages as baseMessages } from '@audius/common/messages'
import { Button, Flex, Text } from '@audius/harmony'

import { CryptoBalanceSection } from './CryptoBalanceSection'
import { USDCBalanceSection } from './USDCBalanceSection'
import { useTokenAmountFormatting } from './hooks/useTokenAmountFormatting'
import { TokenInfo } from './types'

const messages = {
  ...baseMessages,
  priceEach: (price: number) => {
    const formatted = price.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD'
    })
    return `(${formatted} ea.)`
  }
}

type SwapBalanceSectionProps = {
  title: string
  tokenInfo: TokenInfo
  amount: string
  priceLabel?: string
}

const SwapBalanceSection = (props: SwapBalanceSectionProps) => {
  const { title, tokenInfo, amount, priceLabel } = props
  if (tokenInfo.symbol === 'USDC') {
    return (
      <USDCBalanceSection title={title} tokenInfo={tokenInfo} amount={amount} />
    )
  }
  return (
    <CryptoBalanceSection
      title={title}
      tokenInfo={tokenInfo}
      amount={amount}
      priceLabel={priceLabel}
    />
  )
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
          onClick={onConfirm}
          isLoading={isConfirming}
        >
          {messages.confirm}
        </Button>
      </Flex>
    </Flex>
  )
}
