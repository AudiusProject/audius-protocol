import React, { useState, useEffect, useMemo, useCallback } from 'react'

import { useBuySellAnalytics } from '@audius/common/hooks'
import { buySellMessages as messages } from '@audius/common/messages'
import type { BuySellTab } from '@audius/common/store'
import {
  useBuySellScreen,
  useBuySellSwap,
  useBuySellTabs,
  useBuySellTransactionData,
  useSwapDisplayData,
  useSupportedTokenPairs,
  useAddCashModal,
  getSwapTokens,
  AUDIO_TICKER,
  createFallbackPair
} from '@audius/common/store'
import { useFocusEffect } from '@react-navigation/native'

import { Button, Flex, Hint, TextLink } from '@audius/harmony-native'
import { SegmentedControl } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'

import { BuyScreen, SellScreen } from './components'

type BuySellFlowProps = {
  onClose: () => void
  initialTab?: BuySellTab
  coinTicker?: string
}

const WALLET_GUIDE_URL = 'https://help.audius.co/product/wallet-guide'

export const BuySellFlow = ({
  onClose,
  initialTab = 'buy',
  coinTicker = AUDIO_TICKER
}: BuySellFlowProps) => {
  const navigation = useNavigation()
  const { onOpen: openAddCashModal } = useAddCashModal()
  const { trackSwapRequested, trackAddFundsClicked } = useBuySellAnalytics()

  const { currentScreen, setCurrentScreen } = useBuySellScreen({
    initialScreen: 'input'
  })

  const {
    transactionData,
    hasSufficientBalance,
    handleTransactionDataChange,
    resetTransactionData
  } = useBuySellTransactionData()

  const { activeTab, handleActiveTabChange } = useBuySellTabs({
    setCurrentScreen,
    resetTransactionData,
    initialTab
  })

  // Reset screen state to 'input' when this screen comes into focus
  // This handles the case where we navigate back from ConfirmSwapScreen
  useFocusEffect(
    useCallback(() => {
      setCurrentScreen('input')
    }, [setCurrentScreen])
  )

  // Persistent state for each tab's input values
  const [tabInputValues, setTabInputValues] = useState<
    Record<BuySellTab, string>
  >({
    buy: '',
    sell: '',
    convert: ''
  })

  // Update input value for buy tab
  const handleBuyInputValueChange = (value: string) => {
    setTabInputValues((prev) => ({
      ...prev,
      buy: value
    }))
  }

  // Update input value for sell tab
  const handleSellInputValueChange = (value: string) => {
    setTabInputValues((prev) => ({
      ...prev,
      sell: value
    }))
  }

  const { getDefaultPair, getPair } = useSupportedTokenPairs()
  const selectedPair = useMemo(() => {
    // First try to get a pair for the specific coinTicker with USDC
    const specificPair = getPair(coinTicker, 'USDC')
    if (specificPair) {
      return specificPair
    }

    // Fallback to default pair (AUDIO/USDC)
    return getDefaultPair()
  }, [getPair, getDefaultPair, coinTicker])

  // Create fallback pair if none available
  const safeSelectedPair = selectedPair || createFallbackPair()

  const { handleShowConfirmation, isContinueButtonLoading } = useBuySellSwap({
    transactionData,
    currentScreen,
    setCurrentScreen,
    activeTab,
    selectedPair: safeSelectedPair,
    onClose
  })

  // Track if user has attempted to submit the form
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false)

  const swapTokens = useMemo(
    () => getSwapTokens(activeTab, safeSelectedPair),
    [activeTab, safeSelectedPair]
  )

  const currentExchangeRate = useMemo(
    () => transactionData?.exchangeRate ?? undefined,
    [transactionData?.exchangeRate]
  )

  const { confirmationScreenData } = useSwapDisplayData({
    swapStatus: null, // Not needed in this component
    currentScreen,
    transactionData,
    swapResult: null, // Not needed in this component
    activeTab,
    selectedPair: safeSelectedPair
  })

  const tabs = [
    { key: 'buy' as BuySellTab, text: messages.buy },
    { key: 'sell' as BuySellTab, text: messages.sell }
  ]

  const handleContinueClick = useCallback(() => {
    setHasAttemptedSubmit(true)
    if (transactionData?.isValid && !isContinueButtonLoading) {
      trackSwapRequested({
        activeTab,
        inputToken: swapTokens.inputToken,
        outputToken: swapTokens.outputToken,
        inputAmount: transactionData.inputAmount,
        outputAmount: transactionData.outputAmount,
        exchangeRate: currentExchangeRate
      })

      handleShowConfirmation()

      // Navigate to confirmation screen with the data
      if (confirmationScreenData) {
        navigation.navigate('ConfirmSwapScreen', {
          confirmationData: confirmationScreenData
        })
      }
    }
  }, [
    setHasAttemptedSubmit,
    isContinueButtonLoading,
    handleShowConfirmation,
    confirmationScreenData,
    navigation,
    activeTab,
    transactionData,
    swapTokens,
    currentExchangeRate,
    trackSwapRequested
  ])

  useEffect(() => {
    setHasAttemptedSubmit(false)
  }, [activeTab])

  const isTransactionInvalid = !transactionData?.isValid

  const displayErrorMessage = useMemo(() => {
    if (
      activeTab === 'sell' &&
      !hasSufficientBalance &&
      !!tabInputValues.sell
    ) {
      return messages.insufficientAUDIOForSale
    }
    // Prioritize the specific validation error from the form
    if (hasAttemptedSubmit && transactionData?.error) {
      return transactionData.error
    }
    // Fallback for empty input
    if (
      hasAttemptedSubmit &&
      isTransactionInvalid &&
      !(activeTab === 'buy' && !hasSufficientBalance)
    ) {
      return messages.emptyAmount
    }
    return undefined
  }, [
    activeTab,
    hasSufficientBalance,
    hasAttemptedSubmit,
    isTransactionInvalid,
    tabInputValues,
    transactionData
  ])

  const handleAddCash = useCallback(() => {
    openAddCashModal()
    trackAddFundsClicked('insufficient_balance_hint')
  }, [openAddCashModal, trackAddFundsClicked])

  const shouldShowError =
    !!displayErrorMessage ||
    (activeTab === 'buy' && !hasSufficientBalance && !!tabInputValues.buy)

  // Always show the input screen in mobile - other screens are separate
  return {
    content: (
      <Flex direction='column' gap='xl'>
        {/* Tab Control */}
        <Flex alignItems='center' justifyContent='center'>
          <SegmentedControl
            options={tabs}
            selected={activeTab}
            onSelectOption={handleActiveTabChange}
            fullWidth
          />
        </Flex>

        {/* Tab Content */}
        <Flex style={{ display: activeTab === 'buy' ? 'flex' : 'none' }}>
          <BuyScreen
            tokenPair={safeSelectedPair}
            onTransactionDataChange={
              activeTab === 'buy' ? handleTransactionDataChange : undefined
            }
            error={shouldShowError}
            errorMessage={displayErrorMessage}
            initialInputValue={tabInputValues.buy}
            onInputValueChange={handleBuyInputValueChange}
          />
        </Flex>
        <Flex style={{ display: activeTab === 'sell' ? 'flex' : 'none' }}>
          <SellScreen
            tokenPair={safeSelectedPair}
            onTransactionDataChange={
              activeTab === 'sell' ? handleTransactionDataChange : undefined
            }
            error={shouldShowError}
            errorMessage={displayErrorMessage}
            initialInputValue={tabInputValues.sell}
            onInputValueChange={handleSellInputValueChange}
          />
        </Flex>

        {/* Insufficient Balance Message for Buy */}
        {activeTab === 'buy' &&
          !hasSufficientBalance &&
          !!tabInputValues.buy && (
            <Hint
              actions={
                <TextLink variant='visible' onPress={handleAddCash}>
                  {messages.addCash}
                </TextLink>
              }
            >
              {messages.insufficientUSDC}
            </Hint>
          )}

        {/* Help Center Hint */}
        {hasSufficientBalance && (
          <Hint>
            {messages.helpCenter}{' '}
            <TextLink showUnderline variant='visible' url={WALLET_GUIDE_URL}>
              {messages.walletGuide}
            </TextLink>
          </Hint>
        )}
      </Flex>
    ),
    footer: (
      <Button
        variant='primary'
        fullWidth
        isLoading={isContinueButtonLoading}
        onPress={handleContinueClick}
      >
        {messages.continue}
      </Button>
    )
  }
}
