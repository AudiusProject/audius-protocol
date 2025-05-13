import { useCallback, useContext, useEffect, useState, useMemo } from 'react'

import { useSwapTokens } from '@audius/common/api'
import { buySellMessages as messages } from '@audius/common/messages'
import { TOKEN_LISTING_MAP } from '@audius/common/src/store/ui/buy-audio/constants'
import { Button, Flex, Hint, SegmentedControl, TextLink } from '@audius/harmony'

import { ToastContext } from 'components/toast/ToastContext'

import { BuyTab } from './BuyTab'
import { ConfirmSwapScreen } from './ConfirmSwapScreen'
import { SellTab } from './SellTab'
import { SUPPORTED_TOKEN_PAIRS } from './constants'
import { BuySellTab } from './types'

type BuySellFlowProps = {
  onClose: () => void
  openAddFundsModal: () => void
  onScreenChange: (screen: 'input' | 'confirm') => void
}

export const BuySellFlow = (props: BuySellFlowProps) => {
  const { onClose, openAddFundsModal, onScreenChange } = props
  const { toast } = useContext(ToastContext)
  const [activeTab, setActiveTab] = useState<BuySellTab>('buy')
  const [currentScreen, setCurrentScreenInternal] = useState<
    'input' | 'confirm'
  >('input')
  // selectedPairIndex will be used in future when multiple token pairs are supported
  const [selectedPairIndex] = useState(0)

  // Transaction state
  const [transactionData, setTransactionData] = useState<{
    inputAmount: number
    outputAmount: number
    isValid: boolean
  } | null>(null)
  const [hasSufficientBalance, setHasSufficientBalance] = useState(true)

  // Get the swap tokens mutation
  const {
    mutate: swapTokens,
    status: swapStatus,
    error: swapError
  } = useSwapTokens()

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
      inputAmount: transactionData.inputAmount,
      outputAmount: transactionData.outputAmount
    }
  }, [activeTab, selectedPair, transactionData])

  const setCurrentScreen = useCallback(
    (screen: 'input' | 'confirm') => {
      setCurrentScreenInternal(screen)
      onScreenChange(screen)
    },
    [onScreenChange]
  )

  const handleActiveTabChange = useCallback(
    (newTab: string) => {
      setActiveTab(newTab as BuySellTab)
      // Reset transaction data and screen when changing tabs
      setTransactionData(null)
      setCurrentScreen('input')
    },
    [setCurrentScreen]
  )

  const handleTransactionDataChange = useCallback(
    (data: { inputAmount: number; outputAmount: number; isValid: boolean }) => {
      setTransactionData(data)
      // Update sufficient balance based on input amount and validity
      // (Inferring insufficient balance if amount > 0 and not valid)
      setHasSufficientBalance(!(data.inputAmount > 0 && !data.isValid))
    },
    []
  )

  // Handle continue button click to show confirmation
  const handleShowConfirmation = useCallback(() => {
    if (
      !transactionData ||
      !transactionData.isValid ||
      currentScreen !== 'input'
    )
      return
    setCurrentScreen('confirm')
  }, [transactionData, currentScreen, setCurrentScreen])

  // Handle actual swap confirmation
  const handleConfirmSwap = useCallback(() => {
    if (
      !transactionData ||
      !transactionData.isValid ||
      currentScreen !== 'confirm'
    )
      return

    const { inputAmount } = transactionData

    // Determine swap direction based on active tab
    if (activeTab === 'buy') {
      // Buy AUDIO with USDC
      swapTokens({
        inputMint: TOKEN_LISTING_MAP.USDC.address,
        outputMint: TOKEN_LISTING_MAP.AUDIO.address,
        amountUi: inputAmount,
        slippageBps: 50 // Default slippage
      })
    } else {
      // Sell AUDIO for USDC
      swapTokens({
        inputMint: TOKEN_LISTING_MAP.AUDIO.address,
        outputMint: TOKEN_LISTING_MAP.USDC.address,
        amountUi: inputAmount,
        slippageBps: 50 // Default slippage
      })
    }
  }, [activeTab, transactionData, swapTokens, currentScreen])

  // Handle swap status changes
  useEffect(() => {
    if (swapStatus === 'success') {
      toast(
        activeTab === 'buy' ? messages.buySuccess : messages.sellSuccess,
        3000
      )
      // Reset screen to input and close modal after 1 second on success
      const timer = setTimeout(() => {
        setCurrentScreen('input') // Reset screen state
        onClose()
      }, 1000)

      return () => clearTimeout(timer)
    } else if (swapStatus === 'error') {
      toast(swapError?.message || messages.transactionFailed, 5000)
    }
  }, [swapStatus, swapError, activeTab, onClose, toast, setCurrentScreen])

  const isContinueButtonLoading =
    swapStatus === 'pending' && currentScreen === 'input'
  const isConfirmButtonLoading =
    swapStatus === 'pending' && currentScreen === 'confirm'

  const isContinueButtonDisabled =
    !transactionData?.isValid || isContinueButtonLoading

  const errorMessage =
    activeTab === 'sell' && !hasSufficientBalance
      ? messages.insufficientAUDIOForSale
      : undefined

  return (
    <>
      {/* Input Screen Wrapper - always rendered, conditionally visible */}
      <Flex
        direction='column'
        style={{ display: currentScreen === 'input' ? 'flex' : 'none' }} // Use flex for display
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

          {/* Insufficient USDC balance hint, only on buy tab */}
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
        style={{ display: currentScreen === 'confirm' ? 'flex' : 'none' }} // Use flex for display
      >
        {currentScreen === 'confirm' && confirmationScreenData ? (
          <ConfirmSwapScreen
            payTokenInfo={confirmationScreenData.payTokenInfo}
            receiveTokenInfo={confirmationScreenData.receiveTokenInfo}
            payAmount={confirmationScreenData.inputAmount}
            receiveAmount={confirmationScreenData.outputAmount}
            pricePerBaseToken={confirmationScreenData.pricePerBaseToken}
            baseTokenSymbol={confirmationScreenData.baseTokenSymbol}
            onBack={() => setCurrentScreen('input')}
            onConfirm={handleConfirmSwap}
            isConfirming={isConfirmButtonLoading}
          />
        ) : null}
      </Flex>
    </>
  )
}
