import { useState, useEffect, useContext } from 'react'

import { buySellMessages as messages } from '@audius/common/messages'
import {
  useBuySellScreen,
  useBuySellSwap,
  useBuySellTabs,
  useBuySellTransactionData,
  useSwapDisplayData,
  BuySellTab,
  Screen
} from '@audius/common/store'
import { Button, Flex, Hint, SegmentedControl, TextLink } from '@audius/harmony'

import { ModalLoading } from 'components/modal-loading'
import { ToastContext } from 'components/toast/ToastContext'

import { BuyTab } from './BuyTab'
import { ConfirmSwapScreen } from './ConfirmSwapScreen'
import { SellTab } from './SellTab'
import { TransactionSuccessScreen } from './TransactionSuccessScreen'
import { SUPPORTED_TOKEN_PAIRS } from './constants'

type BuySellFlowProps = {
  onClose: () => void
  openAddCashModal: () => void
  onScreenChange: (screen: Screen) => void
  onLoadingStateChange?: (isLoading: boolean) => void
}

export const BuySellFlow = (props: BuySellFlowProps) => {
  const { onClose, openAddCashModal, onScreenChange, onLoadingStateChange } =
    props
  const { toast } = useContext(ToastContext)

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
    resetTransactionData
  })

  const {
    handleShowConfirmation,
    handleConfirmSwap,
    isContinueButtonLoading,
    isConfirmButtonLoading,
    swapStatus,
    swapResult,
    swapError
  } = useBuySellSwap({
    transactionData,
    currentScreen,
    setCurrentScreen,
    activeTab,
    onClose
  })

  useEffect(() => {
    onLoadingStateChange?.(isConfirmButtonLoading)
  }, [isConfirmButtonLoading, onLoadingStateChange])

  useEffect(() => {
    if (swapStatus === 'error' && swapError) {
      toast(swapError.message || messages.transactionFailed, 5000)
    }
  }, [swapStatus, swapError, toast])

  const [selectedPairIndex] = useState(0)

  const tabs = [
    { key: 'buy' as BuySellTab, text: messages.buy },
    { key: 'sell' as BuySellTab, text: messages.sell }
  ]

  const selectedPair = SUPPORTED_TOKEN_PAIRS[selectedPairIndex]

  const {
    successDisplayData,
    resetSuccessDisplayData,
    confirmationScreenData
  } = useSwapDisplayData({
    swapStatus,
    currentScreen,
    transactionData,
    swapResult,
    activeTab,
    selectedPair
  })

  const isContinueButtonDisabled =
    !transactionData?.isValid || isContinueButtonLoading

  const errorMessage =
    activeTab === 'sell' && !hasSufficientBalance
      ? messages.insufficientAUDIOForSale
      : undefined

  if (isConfirmButtonLoading && currentScreen !== 'success') {
    return <ModalLoading />
  }

  return (
    <>
      <Flex
        direction='column'
        style={{ display: currentScreen === 'input' ? 'flex' : 'none' }}
      >
        <Flex direction='column' gap='l'>
          <Flex alignItems='center' justifyContent='space-between'>
            <SegmentedControl
              options={tabs}
              selected={activeTab}
              onSelectOption={handleActiveTabChange}
              css={{ flex: 1 }}
            />
          </Flex>

          {activeTab === 'buy' ? (
            <BuyTab
              tokenPair={selectedPair}
              onTransactionDataChange={handleTransactionDataChange}
              error={!hasSufficientBalance}
            />
          ) : (
            <SellTab
              tokenPair={selectedPair}
              onTransactionDataChange={handleTransactionDataChange}
              error={!hasSufficientBalance}
              errorMessage={errorMessage}
            />
          )}

          {activeTab === 'buy' && !hasSufficientBalance ? (
            <Hint>
              {messages.insufficientUSDC}
              <br />
              <TextLink
                variant='visible'
                href='#'
                onClick={() => {
                  onClose()
                  openAddCashModal()
                }}
              >
                {messages.addCash}
              </TextLink>
            </Hint>
          ) : null}

          {hasSufficientBalance ? (
            <Hint>
              {messages.helpCenter}{' '}
              <TextLink
                variant='visible'
                href='#' // Replace with actual URL when available
              >
                {messages.walletGuide}
              </TextLink>
            </Hint>
          ) : null}

          <Button
            variant='primary'
            fullWidth
            disabled={isContinueButtonDisabled}
            isLoading={isContinueButtonLoading}
            onClick={handleShowConfirmation}
          >
            {messages.continue}
          </Button>
        </Flex>
      </Flex>

      <Flex
        direction='column'
        style={{ display: currentScreen === 'confirm' ? 'flex' : 'none' }}
      >
        {currentScreen === 'confirm' && confirmationScreenData ? (
          <ConfirmSwapScreen
            {...confirmationScreenData}
            onBack={() => setCurrentScreen('input')}
            onConfirm={handleConfirmSwap}
            isConfirming={isConfirmButtonLoading}
          />
        ) : null}
      </Flex>

      <Flex
        direction='column'
        style={{ display: currentScreen === 'success' ? 'flex' : 'none' }}
      >
        {currentScreen === 'success' && successDisplayData ? (
          <TransactionSuccessScreen
            {...successDisplayData}
            onDone={() => {
              onClose()
              resetTransactionData()
              resetSuccessDisplayData()
              setCurrentScreen('input')
            }}
          />
        ) : null}
      </Flex>
    </>
  )
}
