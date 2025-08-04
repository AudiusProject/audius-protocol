import { buySellMessages as messages } from '@audius/common/messages'
import { useTokenAmountFormatting, TokenInfo } from '@audius/common/store'
import { Button, CompletionCheck, Flex, Text } from '@audius/harmony'

import { SwapBalanceSection } from './SwapBalanceSection'

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
    isStablecoin: !!payTokenInfo.isStablecoin,
    decimals: payTokenInfo.decimals
  })

  const { formattedAmount: formattedReceiveAmount } = useTokenAmountFormatting({
    amount: receiveAmount,
    availableBalance: receiveAmount, // Use actual amount as available balance for display
    isStablecoin: !!receiveTokenInfo.isStablecoin,
    decimals: receiveTokenInfo.decimals
  })

  const isReceivingBaseToken = receiveTokenInfo.symbol === baseTokenSymbol
  const priceLabel = isReceivingBaseToken
    ? messages.priceEach(pricePerBaseToken)
    : undefined

  if (!formattedPayAmount || !formattedReceiveAmount) return null

  return (
    <Flex direction='column' gap='xl'>
      <Flex direction='row' gap='s' alignItems='center'>
        <CompletionCheck value='complete' />
        <Text variant='heading' size='s' color='default'>
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
