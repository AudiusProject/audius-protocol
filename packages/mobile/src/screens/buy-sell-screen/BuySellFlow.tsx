import React, { useState, useEffect, useMemo, useCallback } from 'react'

import { buySellMessages as messages } from '@audius/common/messages'
import { Name } from '@audius/common/models'
import type { BuySellTab } from '@audius/common/store'
import {
  useBuySellScreen,
  useBuySellSwap,
  useBuySellTabs,
  useBuySellTransactionData,
  useSwapDisplayData,
  SUPPORTED_TOKEN_PAIRS,
  useAddCashModal
} from '@audius/common/store'
import { useFocusEffect } from '@react-navigation/native'

import { Button, Flex, Hint, TextLink } from '@audius/harmony-native'
import { SegmentedControl } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'
import { make, track } from 'app/services/analytics'

import { BuyScreen, SellScreen } from './components'

type BuySellFlowProps = {
  onClose: () => void
  initialTab?: BuySellTab
}

const WALLET_GUIDE_URL = 'https://help.audius.co/product/wallet-guide'

export const BuySellFlow = ({
  onClose,
  initialTab = 'buy'
}: BuySellFlowProps) => {
  const navigation = useNavigation()
  const { onOpen: openAddCashModal } = useAddCashModal()

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
    sell: ''
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

  const { handleShowConfirmation, isContinueButtonLoading } = useBuySellSwap({
    transactionData,
    currentScreen,
    setCurrentScreen,
    activeTab,
    onClose
  })

  // Track if user has attempted to submit the form
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false)

  const [selectedPairIndex] = useState(0)
  const selectedPair = SUPPORTED_TOKEN_PAIRS[selectedPairIndex]

  const { confirmationScreenData } = useSwapDisplayData({
    swapStatus: null, // Not needed in this component
    currentScreen,
    transactionData,
    swapResult: null, // Not needed in this component
    activeTab,
    selectedPair
  })

  const tabs = [
    { key: 'buy' as BuySellTab, text: messages.buy },
    { key: 'sell' as BuySellTab, text: messages.sell }
  ]

  const handleContinueClick = useCallback(() => {
    setHasAttemptedSubmit(true)
    if (transactionData?.isValid && !isContinueButtonLoading) {
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
    transactionData?.isValid,
    isContinueButtonLoading,
    handleShowConfirmation,
    confirmationScreenData,
    navigation
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
    tabInputValues
  ])

  const handleAddCash = useCallback(() => {
    openAddCashModal()
    track(
      make({
        eventName: Name.BUY_USDC_ADD_FUNDS_MANUALLY
      })
    )
  }, [openAddCashModal])

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
            tokenPair={selectedPair}
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
            tokenPair={selectedPair}
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
