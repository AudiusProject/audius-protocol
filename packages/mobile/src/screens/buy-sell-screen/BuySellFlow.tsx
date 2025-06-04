import React, { useState, useEffect, useMemo, useCallback } from 'react'

import { buySellMessages as messages } from '@audius/common/messages'
import { Name } from '@audius/common/models'
import type { BuySellTab, Screen } from '@audius/common/store'
import {
  useBuySellScreen,
  useBuySellSwap,
  useBuySellTabs,
  useBuySellTransactionData,
  SUPPORTED_TOKEN_PAIRS,
  useAddCashModal
} from '@audius/common/store'

import { Button, Flex, Hint, TextLink } from '@audius/harmony-native'
import { SegmentedControl } from 'app/components/core'
import { make, track } from 'app/services/analytics'

import { BuyScreen, SellScreen } from './components'

type BuySellFlowProps = {
  onClose: () => void
  onNavigateToConfirm?: () => void
  onScreenChange: (screen: Screen) => void
  onLoadingStateChange?: (isLoading: boolean) => void
  initialTab?: 'buy' | 'sell'
}

const WALLET_GUIDE_URL = 'https://help.audius.co/product/wallet-guide'

export const BuySellFlow = ({
  onClose,
  onNavigateToConfirm,
  onScreenChange,
  onLoadingStateChange,
  initialTab = 'buy'
}: BuySellFlowProps) => {
  const { onOpen: openAddCashModal } = useAddCashModal()

  const { currentScreen, setCurrentScreen } = useBuySellScreen({
    onScreenChange
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
    initialTab: (initialTab as BuySellTab) || 'buy'
  })

  // Persistent state for each tab's input values
  const [tabInputValues, setTabInputValues] = useState<
    Record<BuySellTab, string>
  >({
    buy: '',
    sell: ''
  })

  // Update input value for current tab
  const handleTabInputValueChange = (value: string) => {
    setTabInputValues((prev) => ({
      ...prev,
      [activeTab]: value
    }))
  }

  const {
    handleShowConfirmation,
    isContinueButtonLoading,
    isConfirmButtonLoading
  } = useBuySellSwap({
    transactionData,
    currentScreen,
    setCurrentScreen,
    activeTab,
    onClose
  })

  // Track if user has attempted to submit the form
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false)

  useEffect(() => {
    onLoadingStateChange?.(isConfirmButtonLoading)
  }, [isConfirmButtonLoading, onLoadingStateChange])

  const [selectedPairIndex] = useState(0)

  const tabs = [
    { key: 'buy' as BuySellTab, text: messages.buy },
    { key: 'sell' as BuySellTab, text: messages.sell }
  ]

  const selectedPair = SUPPORTED_TOKEN_PAIRS[selectedPairIndex]

  const handleContinueClick = () => {
    setHasAttemptedSubmit(true)
    if (transactionData?.isValid && !isContinueButtonLoading) {
      handleShowConfirmation()
      onNavigateToConfirm?.()
    }
  }

  useEffect(() => {
    setHasAttemptedSubmit(false)
  }, [activeTab])

  const isTransactionInvalid = !transactionData?.isValid

  const displayErrorMessage = useMemo(() => {
    if (activeTab === 'sell' && !hasSufficientBalance) {
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
    isTransactionInvalid
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
    !!displayErrorMessage || (activeTab === 'buy' && !hasSufficientBalance)

  // Only show the input screen for now - confirm and success screens will be separate mobile screens
  if (currentScreen !== 'input') {
    return null
  }

  return (
    <Flex direction='column' gap='xl' p='l'>
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
      {activeTab === 'buy' ? (
        <BuyScreen
          tokenPair={selectedPair}
          onTransactionDataChange={handleTransactionDataChange}
          error={shouldShowError}
          errorMessage={displayErrorMessage}
          initialInputValue={tabInputValues.buy}
          onInputValueChange={handleTabInputValueChange}
        />
      ) : (
        <SellScreen
          tokenPair={selectedPair}
          onTransactionDataChange={handleTransactionDataChange}
          error={shouldShowError}
          errorMessage={displayErrorMessage}
          initialInputValue={tabInputValues.sell}
          onInputValueChange={handleTabInputValueChange}
        />
      )}

      {/* Insufficient Balance Message for Buy */}
      {activeTab === 'buy' && !hasSufficientBalance && (
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

      {/* Continue Button */}
      <Button
        variant='primary'
        fullWidth
        isLoading={isContinueButtonLoading}
        onPress={handleContinueClick}
      >
        {messages.continue}
      </Button>
    </Flex>
  )
}
