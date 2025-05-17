import { buySellMessages as messages } from '@audius/common/messages'
import { Button, CompletionCheck, Flex, Text } from '@audius/harmony'

import { SwapBalanceSection } from './SwapBalanceSection'
import { useTokenAmountFormatting } from './hooks/useTokenAmountFormatting'
import { TokenInfo } from './types'

type TransactionSuccessScreenProps = {
  payTokenInfo: TokenInfo
  receiveTokenInfo: TokenInfo
  payAmount: number
  receiveAmount: number
  pricePerBaseToken: number
  baseTokenSymbol: string
  onDone: () => void
}

export const TransactionSuccessScreen = (
  props: TransactionSuccessScreenProps
) => {
  const {
    payTokenInfo,
    receiveTokenInfo,
    payAmount,
    receiveAmount,
    pricePerBaseToken,
    baseTokenSymbol,
    onDone
  } = props

  const { formattedAmount: formattedPayAmount } = useTokenAmountFormatting({
    amount: payAmount,
    availableBalance: payAmount, // Use actual amount as available balance for display
    isStablecoin: !!payTokenInfo.isStablecoin
  })

  const { formattedAmount: formattedReceiveAmount } = useTokenAmountFormatting({
    amount: receiveAmount,
    availableBalance: receiveAmount, // Use actual amount as available balance for display
    isStablecoin: !!receiveTokenInfo.isStablecoin
  })

  const isReceivingBaseToken = receiveTokenInfo.symbol === baseTokenSymbol
  const priceLabel = isReceivingBaseToken
    ? messages.priceEach(pricePerBaseToken)
    : undefined

  return (
    <Flex direction='column' gap='xl'>
      <Flex direction='row' gap='xs' alignItems='center'>
        <CompletionCheck value='complete' />
        <Text variant='heading' size='s' color='subdued'>
          {messages.transactionComplete}
        </Text>
      </Flex>
      <Flex direction='column' gap='xl' w='100%'>
        <SwapBalanceSection
          title={messages.youPaid}
          tokenInfo={payTokenInfo}
          amount={formattedPayAmount}
        />
        <SwapBalanceSection
          title={messages.youReceived}
          tokenInfo={receiveTokenInfo}
          amount={formattedReceiveAmount}
          priceLabel={priceLabel}
        />
      </Flex>

      <Flex>
        <Button variant='primary' fullWidth onClick={onDone}>
          {messages.done}
        </Button>
      </Flex>
    </Flex>
  )
}
