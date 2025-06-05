import React from 'react'

import { formatUSDCValue } from '@audius/common/api'
import { buySellMessages as baseMessages } from '@audius/common/messages'
import type { SuccessDisplayData } from '@audius/common/store'
import { useTokenAmountFormatting } from '@audius/common/store'

import {
  Button,
  CompletionCheck,
  Divider,
  Flex,
  Text
} from '@audius/harmony-native'
import { Screen, ScreenContent } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'

import { SwapBalanceSection } from '../../components/buy-sell'

const messages = {
  ...baseMessages,
  priceEach: (price: number) => {
    const formatted = formatUSDCValue(price, { includeDollarSign: true })
    return `(${formatted} ea.)`
  }
}

type TransactionResult = {
  status: 'success' | 'error'
  data?: SuccessDisplayData
  error?: { message?: string }
}

type TransactionResultScreenProps = {
  route: {
    params: {
      result: TransactionResult
    }
  }
}

export const TransactionResultScreen = ({
  route
}: TransactionResultScreenProps) => {
  const navigation = useNavigation()
  const { result } = route.params

  // Always call hooks at the top level to avoid conditional hook calls
  const successData = result.status === 'success' ? result.data : null

  const { formattedAmount: formattedPayAmount } = useTokenAmountFormatting({
    amount: successData?.payAmount || 0,
    availableBalance: successData?.payAmount || 0,
    isStablecoin: !!successData?.payTokenInfo.isStablecoin
  })

  const { formattedAmount: formattedReceiveAmount } = useTokenAmountFormatting({
    amount: successData?.receiveAmount || 0,
    availableBalance: successData?.receiveAmount || 0,
    isStablecoin: !!successData?.receiveTokenInfo.isStablecoin
  })

  const handleDone = () => {
    // Navigate back to the wallet screen after successful transaction
    navigation.navigate('wallet')
  }

  if (result.status === 'success' && successData) {
    const {
      payTokenInfo,
      receiveTokenInfo,
      pricePerBaseToken,
      baseTokenSymbol
    } = successData

    const isReceivingBaseToken = receiveTokenInfo.symbol === baseTokenSymbol
    const priceLabel = isReceivingBaseToken
      ? messages.priceEach(pricePerBaseToken)
      : undefined

    if (!formattedPayAmount || !formattedReceiveAmount) return null

    return (
      <Screen
        title={messages.modalSuccessTitle}
        variant='white'
        url='/buy-sell/success'
      >
        <ScreenContent>
          <Flex direction='column' gap='xl' p='l'>
            <Flex direction='row' gap='s' alignItems='center'>
              <CompletionCheck value='complete' />
              <Text variant='heading' size='s' color='default'>
                {messages.transactionComplete}
              </Text>
            </Flex>
            <Flex direction='column' gap='xl'>
              <SwapBalanceSection
                title={messages.youPaid}
                tokenInfo={payTokenInfo}
                amount={formattedPayAmount}
              />
              <Divider flex={1} />
              <SwapBalanceSection
                title={messages.youReceived}
                tokenInfo={receiveTokenInfo}
                amount={formattedReceiveAmount}
                priceLabel={priceLabel}
              />
            </Flex>

            <Flex mt='xl'>
              <Button variant='primary' fullWidth onPress={handleDone}>
                {messages.done}
              </Button>
            </Flex>
          </Flex>
        </ScreenContent>
      </Screen>
    )
  }

  return null
}
