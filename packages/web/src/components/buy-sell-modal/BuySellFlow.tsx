import { useMemo, useState } from 'react'

import { buySellMessages as messages } from '@audius/common/messages'
import { Button, Flex, Hint, SegmentedControl, TextLink } from '@audius/harmony'

import { BuyTab } from './BuyTab'
import { ConfirmSwapScreen } from './ConfirmSwapScreen'
import { SellTab } from './SellTab'
import { SUPPORTED_TOKEN_PAIRS } from './constants'
import {
  useBuySellScreen,
  useBuySellSwap,
  useBuySellTabs,
  useBuySellTransactionData
} from './hooks'
import { BuySellTab } from './types'

type BuySellFlowProps = {
  onClose: () => void
  openAddFundsModal: () => void
  onScreenChange: (screen: 'input' | 'confirm') => void
}

export const BuySellFlow = (props: BuySellFlowProps) => {
  const { onClose, openAddFundsModal, onScreenChange } = props

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
    isConfirmButtonLoading
  } = useBuySellSwap({
    transactionData,
    currentScreen,
    setCurrentScreen,
    activeTab,
    onClose
  })

  const [selectedPairIndex] = useState(0)

  const tabs = [
    { key: 'buy' as BuySellTab, text: messages.buy },
    { key: 'sell' as BuySellTab, text: messages.sell }
  ]

  const selectedPair = SUPPORTED_TOKEN_PAIRS[selectedPairIndex]

  const confirmationScreenData = useMemo(() => {
    if (!transactionData) return null

    const payInfo =
      activeTab === 'buy' ? selectedPair.quoteToken : selectedPair.baseToken
    const receiveInfo =
      activeTab === 'buy' ? selectedPair.baseToken : selectedPair.quoteToken
    const price =
      activeTab === 'buy'
        ? transactionData.inputAmount / transactionData.outputAmount
        : transactionData.outputAmount / transactionData.inputAmount

    return {
      payTokenInfo: payInfo,
      receiveTokenInfo: receiveInfo,
      pricePerBaseToken: price,
      baseTokenSymbol: selectedPair.baseToken.symbol,
      payAmount: transactionData.inputAmount,
      receiveAmount: transactionData.outputAmount
    }
  }, [activeTab, selectedPair, transactionData])

  const isContinueButtonDisabled =
    !transactionData?.isValid || isContinueButtonLoading

  const errorMessage =
    activeTab === 'sell' && !hasSufficientBalance
      ? messages.insufficientAUDIOForSale
      : undefined

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
                  openAddFundsModal()
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
    </>
  )
}
