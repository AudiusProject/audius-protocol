import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { formatUSDCValue } from '@audius/common/api'
import { buySellMessages as baseMessages } from '@audius/common/messages'
import type { TokenInfo } from '@audius/common/store'
import {
  SUPPORTED_TOKEN_PAIRS,
  useBuySellScreen,
  useBuySellSwap,
  useSwapDisplayData,
  useTokenAmountFormatting
} from '@audius/common/store'

import {
  Button,
  Divider,
  Flex,
  LoadingSpinner,
  Text
} from '@audius/harmony-native'
import { Screen, ScreenContent } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'

import { SwapBalanceSection } from '../../components/buy-sell'

import { PoweredByJupiter } from './components/PoweredByJupiter'

const messages = {
  ...baseMessages,
  priceEach: (price: number) => {
    const formatted = formatUSDCValue(price, { includeDollarSign: true })
    return `(${formatted} ea.)`
  },
  loadingTitle: 'Transaction in Progress',
  loadingSubtitle: 'This may take a moment.'
}

type ConfirmSwapScreenProps = {
  route: {
    params: {
      confirmationData: {
        payTokenInfo: TokenInfo
        receiveTokenInfo: TokenInfo
        payAmount: number
        receiveAmount: number
        pricePerBaseToken: number
        baseTokenSymbol: string
      }
    }
  }
}

const LoadingScreen = () => (
  <Flex
    direction='column'
    justifyContent='center'
    alignItems='center'
    gap='l'
    p='xl'
    flex={1}
  >
    <LoadingSpinner />
    <Flex direction='column' alignItems='center' gap='s'>
      <Text variant='heading' size='l' color='default' textAlign='center'>
        {messages.loadingTitle}
      </Text>
      <Text
        variant='title'
        size='l'
        strength='weak'
        color='default'
        textAlign='center'
      >
        {messages.loadingSubtitle}
      </Text>
    </Flex>
  </Flex>
)

export const ConfirmSwapScreen = ({ route }: ConfirmSwapScreenProps) => {
  const navigation = useNavigation()
  const {
    confirmationData: {
      payTokenInfo,
      receiveTokenInfo,
      payAmount,
      receiveAmount,
      pricePerBaseToken,
      baseTokenSymbol
    }
  } = route.params

  const stableOnScreenChange = useCallback(() => {
    // No-op since we handle navigation separately
  }, [])

  const { currentScreen, setCurrentScreen } = useBuySellScreen({
    onScreenChange: stableOnScreenChange
  })

  // Set the screen to 'confirm' when this component mounts
  useEffect(() => {
    setCurrentScreen('confirm')
  }, [setCurrentScreen])

  // Create transaction data from the confirmation data passed via navigation
  const transactionData = useMemo(
    () => ({
      inputAmount: payAmount,
      outputAmount: receiveAmount,
      isValid: true // If we got to the confirmation screen, the data should be valid
    }),
    [payAmount, receiveAmount]
  )

  // Determine if this is a buy or sell based on token types
  const activeTab = payTokenInfo.symbol === 'USDC' ? 'buy' : 'sell'

  const {
    handleConfirmSwap,
    isConfirmButtonLoading,
    swapStatus,
    swapError,
    swapResult
  } = useBuySellSwap({
    transactionData,
    currentScreen,
    setCurrentScreen,
    activeTab,
    onClose: () => navigation.goBack()
  })

  const [selectedPairIndex] = useState(0)
  const selectedPair = SUPPORTED_TOKEN_PAIRS[selectedPairIndex]

  const { successDisplayData } = useSwapDisplayData({
    swapStatus,
    currentScreen,
    transactionData,
    swapResult,
    activeTab,
    selectedPair
  })

  useEffect(() => {
    if (currentScreen === 'success' && successDisplayData) {
      navigation.navigate('TransactionResultScreen', {
        result: {
          status: 'success' as const,
          data: successDisplayData
        }
      })
    }
  }, [currentScreen, successDisplayData, navigation])

  // Handle swap error
  useEffect(() => {
    if (swapStatus === 'error' && swapError) {
      navigation.navigate('TransactionResultScreen', {
        result: {
          status: 'error' as const,
          error: swapError
        }
      })
    }
  }, [swapStatus, swapError, navigation])

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

  const handleBack = () => {
    navigation.goBack()
  }

  const handleConfirm = () => {
    handleConfirmSwap()
  }

  if (!formattedPayAmount || !formattedReceiveAmount) {
    return null
  }

  // Show loading screen when confirming transaction
  if (isConfirmButtonLoading) {
    return (
      <Screen
        title={messages.confirmDetails}
        variant='white'
        url='/buy-sell/confirm'
      >
        <ScreenContent>
          <LoadingScreen />
        </ScreenContent>
      </Screen>
    )
  }

  return (
    <Screen
      title={messages.confirmDetails}
      variant='white'
      url='/buy-sell/confirm'
    >
      <ScreenContent>
        <PoweredByJupiter />
        <Flex direction='column' gap='xl' p='l' mt='xl'>
          <Text variant='body' size='l' textAlign='left'>
            {messages.confirmReview}
          </Text>
          <Flex direction='column' gap='xl'>
            <SwapBalanceSection
              title={messages.youPay}
              tokenInfo={payTokenInfo}
              amount={formattedPayAmount}
            />
            <Divider flex={1} />
            <SwapBalanceSection
              title={messages.youReceive}
              tokenInfo={receiveTokenInfo}
              amount={formattedReceiveAmount}
              priceLabel={priceLabel}
            />
          </Flex>

          <Flex gap='s' mt='xl'>
            <Button variant='secondary' fullWidth onPress={handleBack}>
              {messages.back}
            </Button>
            <Button variant='primary' fullWidth onPress={handleConfirm}>
              {messages.confirm}
            </Button>
          </Flex>
        </Flex>
      </ScreenContent>
    </Screen>
  )
}
