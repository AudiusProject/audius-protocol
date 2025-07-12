import { useState, useEffect, useContext, useMemo } from 'react'

import { useBuySellAnalytics } from '@audius/common/hooks'
import { buySellMessages as messages } from '@audius/common/messages'
import {
  useBuySellScreen,
  useBuySellSwap,
  useBuySellTabs,
  useBuySellTransactionData,
  useSwapDisplayData,
  BuySellTab,
  Screen,
  TokenInfo
} from '@audius/common/store'
import { Button, Flex, Hint, SegmentedControl, TextLink } from '@audius/harmony'

import { ExternalTextLink } from 'components/link'
import { ModalLoading } from 'components/modal-loading'
import { ToastContext } from 'components/toast/ToastContext'

import { BuyTab } from './BuyTab'
import { ConfirmSwapScreen } from './ConfirmSwapScreen'
import { SellTab } from './SellTab'
import { TransactionSuccessScreen } from './TransactionSuccessScreen'
import { SUPPORTED_TOKEN_PAIRS, TOKENS } from './constants'

const WALLET_GUIDE_URL = 'https://help.audius.co/product/wallet-guide'

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
  const {
    trackSwapRequested,
    trackSwapSuccess,
    trackSwapFailure,
    trackAddFundsClicked
  } = useBuySellAnalytics()

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

  // Handle token changes
  const handleInputTokenChange = (symbol: string) => {
    if (activeTab === 'sell') {
      // On sell tab, input token change means base token change
      setBaseTokenSymbol(symbol)
    } else {
      // On buy tab, input token change means quote token change
      setQuoteTokenSymbol(symbol)
    }
    // Reset transaction data when tokens change
    resetTransactionData()
  }

  const handleOutputTokenChange = (symbol: string) => {
    if (activeTab === 'buy') {
      // On buy tab, output token change means base token change
      setBaseTokenSymbol(symbol)
    } else {
      // On sell tab, output token change means quote token change
      setQuoteTokenSymbol(symbol)
    }
    // Reset transaction data when tokens change
    resetTransactionData()
  }

  // Track if user has attempted to submit the form
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false)

  const selectedPair = SUPPORTED_TOKEN_PAIRS[0]

  // State for dynamic token selection - using base/quote terminology
  const [baseTokenSymbol, setBaseTokenSymbol] = useState<string>(
    selectedPair.baseToken.symbol // AUDIO by default
  )
  const [quoteTokenSymbol, setQuoteTokenSymbol] = useState<string>(
    selectedPair.quoteToken.symbol // USDC by default
  )

  // Get all available tokens
  const availableTokens = useMemo(() => {
    const tokensSet = new Set<string>()
    SUPPORTED_TOKEN_PAIRS.forEach((pair) => {
      tokensSet.add(pair.baseToken.symbol)
      tokensSet.add(pair.quoteToken.symbol)
    })
    return Array.from(tokensSet)
      .map((symbol) => Object.values(TOKENS).find((t) => t.symbol === symbol))
      .filter(Boolean) as TokenInfo[]
  }, [])

  // Create current token pair based on selected base and quote tokens
  const currentTokenPair = useMemo(() => {
    const baseTokenInfo = availableTokens.find(
      (t) => t.symbol === baseTokenSymbol
    )
    const quoteTokenInfo = availableTokens.find(
      (t) => t.symbol === quoteTokenSymbol
    )

    if (!baseTokenInfo || !quoteTokenInfo) {
      return selectedPair
    }

    // Find existing pair that matches our tokens
    const pair = SUPPORTED_TOKEN_PAIRS.find(
      (p) =>
        p.baseToken.symbol === baseTokenSymbol &&
        p.quoteToken.symbol === quoteTokenSymbol
    )

    if (pair) {
      return pair
    }

    // Create a dynamic pair if no exact match found
    return {
      baseToken: baseTokenInfo,
      quoteToken: quoteTokenInfo,
      exchangeRate: null
    }
  }, [baseTokenSymbol, quoteTokenSymbol, availableTokens, selectedPair])

  const swapTokens = useMemo(
    () => ({
      inputToken: activeTab === 'buy' ? quoteTokenSymbol : baseTokenSymbol,
      outputToken: activeTab === 'buy' ? baseTokenSymbol : quoteTokenSymbol,
      inputTokenInfo:
        activeTab === 'buy'
          ? currentTokenPair.quoteToken
          : currentTokenPair.baseToken,
      outputTokenInfo:
        activeTab === 'buy'
          ? currentTokenPair.baseToken
          : currentTokenPair.quoteToken
    }),
    [activeTab, baseTokenSymbol, quoteTokenSymbol, currentTokenPair]
  )

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
    selectedPair: currentTokenPair,
    onClose
  })

  const currentExchangeRate = useMemo(
    () => transactionData?.exchangeRate ?? undefined,
    [transactionData?.exchangeRate]
  )

  useEffect(() => {
    onLoadingStateChange?.(isConfirmButtonLoading)
  }, [isConfirmButtonLoading, onLoadingStateChange])

  useEffect(() => {
    if (swapStatus === 'error' && swapError) {
      trackSwapFailure(
        {
          activeTab,
          inputToken: swapTokens.inputToken,
          outputToken: swapTokens.outputToken,
          inputAmount: transactionData?.inputAmount,
          outputAmount: transactionData?.outputAmount,
          exchangeRate: currentExchangeRate
        },
        {
          errorType: 'swap_error',
          errorStage: 'transaction',
          errorMessage: swapError?.message
            ? swapError.message.substring(0, 500)
            : 'Unknown error'
        }
      )

      toast(swapError.message ?? messages.transactionFailed, 5000)
    }
  }, [
    swapStatus,
    swapError,
    toast,
    activeTab,
    transactionData,
    swapTokens,
    currentExchangeRate,
    trackSwapFailure
  ])

  const tabs = [
    { key: 'buy' as BuySellTab, text: messages.buy },
    { key: 'sell' as BuySellTab, text: messages.sell }
  ]

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
    selectedPair: currentTokenPair
  })

  // Track swap success when success screen is shown
  useEffect(() => {
    if (currentScreen === 'success' && successDisplayData && swapResult) {
      trackSwapSuccess({
        activeTab,
        inputToken: swapTokens.inputToken,
        outputToken: swapTokens.outputToken,
        inputAmount: swapResult.inputAmount,
        outputAmount: swapResult.outputAmount,
        exchangeRate: successDisplayData.exchangeRate ?? undefined,
        signature: swapResult.signature || ''
      })
    }
  }, [
    currentScreen,
    successDisplayData,
    swapResult,
    activeTab,
    swapTokens,
    trackSwapSuccess
  ])

  const handleContinueClick = () => {
    setHasAttemptedSubmit(true)
    if (transactionData?.isValid && !isContinueButtonLoading) {
      // Track swap requested
      trackSwapRequested({
        activeTab,
        inputToken: swapTokens.inputToken,
        outputToken: swapTokens.outputToken,
        inputAmount: transactionData.inputAmount,
        outputAmount: transactionData.outputAmount,
        exchangeRate: currentExchangeRate
      })

      handleShowConfirmation()
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
    // Prioritize the specific validation error from the form
    if (hasAttemptedSubmit && transactionData?.error) {
      return transactionData.error
    }
    // Fallback for empty input, though zod should handle it via transactionData.error
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
    transactionData
  ])

  const shouldShowError =
    !!displayErrorMessage || (activeTab === 'buy' && !hasSufficientBalance)

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
              tokenPair={currentTokenPair}
              onTransactionDataChange={handleTransactionDataChange}
              error={shouldShowError}
              errorMessage={displayErrorMessage}
              initialInputValue={tabInputValues.buy}
              onInputValueChange={handleTabInputValueChange}
              availableInputTokens={availableTokens.filter(
                (t) => t.symbol !== baseTokenSymbol
              )}
              availableOutputTokens={availableTokens.filter(
                (t) => t.symbol !== quoteTokenSymbol
              )}
              onInputTokenChange={handleInputTokenChange}
              onOutputTokenChange={handleOutputTokenChange}
            />
          ) : (
            <SellTab
              tokenPair={currentTokenPair}
              onTransactionDataChange={handleTransactionDataChange}
              error={shouldShowError}
              errorMessage={displayErrorMessage}
              initialInputValue={tabInputValues.sell}
              onInputValueChange={handleTabInputValueChange}
              availableInputTokens={availableTokens.filter(
                (t) => t.symbol !== quoteTokenSymbol
              )}
              availableOutputTokens={availableTokens.filter(
                (t) => t.symbol !== baseTokenSymbol
              )}
              onInputTokenChange={handleInputTokenChange}
              onOutputTokenChange={handleOutputTokenChange}
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
                  trackAddFundsClicked('insufficient_balance_hint')
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
              <ExternalTextLink to={WALLET_GUIDE_URL} variant='visible'>
                {messages.walletGuide}
              </ExternalTextLink>
            </Hint>
          ) : null}

          <Button
            variant='primary'
            fullWidth
            isLoading={isContinueButtonLoading}
            onClick={handleContinueClick}
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
            activeTab={activeTab}
            selectedPair={currentTokenPair}
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
              // Clear all tab input values on completion
              setTabInputValues({ buy: '', sell: '' })
            }}
          />
        ) : null}
      </Flex>
    </>
  )
}
