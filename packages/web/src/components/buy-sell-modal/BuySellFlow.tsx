import { useState, useEffect, useContext, useMemo } from 'react'

import { useBuySellAnalytics } from '@audius/common/hooks'
import { buySellMessages as messages } from '@audius/common/messages'
import { FeatureFlags } from '@audius/common/services'
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
import { useFlag } from 'hooks/useRemoteConfig'

import { BuyTab } from './BuyTab'
import { ConfirmSwapScreen } from './ConfirmSwapScreen'
import { ConvertTab } from './ConvertTab'
import { SellTab } from './SellTab'
import { TransactionSuccessScreen } from './TransactionSuccessScreen'
import { useSupportedTokenPairs, useTokens } from './constants'

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
  const { isEnabled: isArtistCoinsEnabled } = useFlag(FeatureFlags.ARTIST_COINS)
  const {
    trackSwapRequested,
    trackSwapSuccess,
    trackSwapFailure,
    trackAddFundsClicked
  } = useBuySellAnalytics()

  // Get tokens and token pairs from API
  const { tokens, isLoading: tokensLoading } = useTokens()
  const { pairs: supportedTokenPairs, isLoading: pairsLoading } =
    useSupportedTokenPairs()

  const isTokenDataLoading = tokensLoading || pairsLoading

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
    sell: '',
    convert: ''
  })

  // Update input value for current tab
  const handleTabInputValueChange = (value: string) => {
    setTabInputValues((prev) => ({
      ...prev,
      [activeTab]: value
    }))
  }

  // Track if user has attempted to submit the form
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false)

  const selectedPair = supportedTokenPairs[0]

  // State for dynamic token selection - separate states for each tab
  // Initialize with default values, will be updated when token pairs load
  const [buyTabTokens, setBuyTabTokens] = useState<{
    baseToken: string
    quoteToken: string
  }>({
    baseToken: 'AUDIO', // AUDIO by default
    quoteToken: 'USDC' // USDC by default
  })

  const [sellTabTokens, setSellTabTokens] = useState<{
    baseToken: string
    quoteToken: string
  }>({
    baseToken: 'AUDIO', // AUDIO by default
    quoteToken: 'USDC' // USDC by default
  })

  const [convertTabTokens, setConvertTabTokens] = useState<{
    baseToken: string
    quoteToken: string
  }>({
    baseToken: 'AUDIO', // AUDIO by default
    quoteToken: 'BONK' // BONK by default for convert tab (excluding USDC)
  })

  // Update token states when selected pair becomes available
  useEffect(() => {
    if (selectedPair && selectedPair.baseToken && selectedPair.quoteToken) {
      setBuyTabTokens({
        baseToken: selectedPair.baseToken.symbol,
        quoteToken: selectedPair.quoteToken.symbol
      })
      setSellTabTokens({
        baseToken: selectedPair.baseToken.symbol,
        quoteToken: selectedPair.quoteToken.symbol
      })
      setConvertTabTokens((prev) => ({
        baseToken: selectedPair.baseToken.symbol,
        quoteToken: prev.quoteToken // Keep BONK for convert tab
      }))
    }
  }, [selectedPair])

  // Get current tab's token symbols
  const currentTabTokens =
    activeTab === 'buy'
      ? buyTabTokens
      : activeTab === 'sell'
        ? sellTabTokens
        : convertTabTokens
  const baseTokenSymbol = currentTabTokens.baseToken
  const quoteTokenSymbol = currentTabTokens.quoteToken

  // Handle token changes
  const handleInputTokenChange = (symbol: string) => {
    if (activeTab === 'sell') {
      // On sell tab, input token change means base token change
      setSellTabTokens((prev) => ({ ...prev, baseToken: symbol }))
    } else if (activeTab === 'buy') {
      // On buy tab, input token change means quote token change
      setBuyTabTokens((prev) => ({ ...prev, quoteToken: symbol }))
    } else {
      // On convert tab, input token change means base token change
      setConvertTabTokens((prev) => ({ ...prev, baseToken: symbol }))
    }
    // Reset transaction data when tokens change
    resetTransactionData()
  }

  const handleOutputTokenChange = (symbol: string) => {
    if (activeTab === 'buy') {
      // On buy tab, output token change means base token change
      setBuyTabTokens((prev) => ({ ...prev, baseToken: symbol }))
    } else if (activeTab === 'sell') {
      // On sell tab, output token change means quote token change
      setSellTabTokens((prev) => ({ ...prev, quoteToken: symbol }))
    } else {
      // On convert tab, output token change means quote token change
      setConvertTabTokens((prev) => ({ ...prev, quoteToken: symbol }))
    }
    // Reset transaction data when tokens change
    resetTransactionData()
  }

  // Get all available tokens
  const availableTokens = useMemo(() => {
    if (isTokenDataLoading || Object.keys(tokens).length === 0) {
      return []
    }

    const tokensSet = new Set<string>()
    supportedTokenPairs.forEach((pair) => {
      tokensSet.add(pair.baseToken.symbol)
      tokensSet.add(pair.quoteToken.symbol)
    })
    return Array.from(tokensSet)
      .map((symbol) => Object.values(tokens).find((t) => t.symbol === symbol))
      .filter(Boolean) as TokenInfo[]
  }, [tokens, supportedTokenPairs, isTokenDataLoading])

  // Create current token pair based on selected base and quote tokens
  const currentTokenPair = useMemo(() => {
    const baseTokenInfo = availableTokens.find(
      (t) => t.symbol === baseTokenSymbol
    )
    const quoteTokenInfo = availableTokens.find(
      (t) => t.symbol === quoteTokenSymbol
    )

    if (!baseTokenInfo || !quoteTokenInfo) {
      return selectedPair || null
    }

    // Find existing pair that matches our tokens
    const pair = supportedTokenPairs.find(
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
  }, [
    baseTokenSymbol,
    quoteTokenSymbol,
    availableTokens,
    selectedPair,
    supportedTokenPairs
  ])

  const swapTokens = useMemo(() => {
    // Return safe defaults if currentTokenPair is not available
    if (!currentTokenPair?.baseToken || !currentTokenPair?.quoteToken) {
      return {
        inputToken: activeTab === 'buy' ? quoteTokenSymbol : baseTokenSymbol,
        outputToken: activeTab === 'buy' ? baseTokenSymbol : quoteTokenSymbol,
        inputTokenInfo: null,
        outputTokenInfo: null
      }
    }

    return {
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
    }
  }, [activeTab, baseTokenSymbol, quoteTokenSymbol, currentTokenPair])

  // Create a safe selectedPair for hooks that can't handle null values
  const safeSelectedPair = useMemo(() => {
    if (currentTokenPair?.baseToken && currentTokenPair?.quoteToken) {
      return currentTokenPair
    }

    // Return minimal safe token pair to prevent hook crashes
    return {
      baseToken: {
        symbol: 'AUDIO',
        name: 'Audius',
        decimals: 8,
        balance: null,
        address: '',
        isStablecoin: false
      },
      quoteToken: {
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        balance: null,
        address: '',
        isStablecoin: true
      },
      exchangeRate: null
    }
  }, [currentTokenPair])

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
    selectedPair: safeSelectedPair,
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

  const tabs = useMemo(() => {
    const baseTabs = [
      { key: 'buy' as BuySellTab, text: messages.buy },
      { key: 'sell' as BuySellTab, text: messages.sell }
    ]

    if (isArtistCoinsEnabled) {
      baseTabs.push({ key: 'convert' as BuySellTab, text: messages.convert })
    }

    return baseTabs
  }, [isArtistCoinsEnabled])

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
    selectedPair: safeSelectedPair
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

  if (isTokenDataLoading) {
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

          {activeTab === 'buy' && currentTokenPair ? (
            <BuyTab
              tokenPair={currentTokenPair}
              onTransactionDataChange={handleTransactionDataChange}
              error={shouldShowError}
              errorMessage={displayErrorMessage}
              initialInputValue={tabInputValues.buy}
              onInputValueChange={handleTabInputValueChange}
            />
          ) : activeTab === 'sell' && currentTokenPair ? (
            <SellTab
              tokenPair={currentTokenPair}
              onTransactionDataChange={handleTransactionDataChange}
              error={shouldShowError}
              errorMessage={displayErrorMessage}
              initialInputValue={tabInputValues.sell}
              onInputValueChange={handleTabInputValueChange}
              availableInputTokens={availableTokens.filter(
                (t) => t.symbol !== baseTokenSymbol && t.symbol !== 'USDC'
              )}
              availableOutputTokens={availableTokens.filter(
                (t) => t.symbol !== quoteTokenSymbol && t.symbol !== 'USDC'
              )}
              onInputTokenChange={handleInputTokenChange}
              onOutputTokenChange={handleOutputTokenChange}
            />
          ) : isArtistCoinsEnabled && currentTokenPair ? (
            <ConvertTab
              tokenPair={currentTokenPair}
              onTransactionDataChange={handleTransactionDataChange}
              error={shouldShowError}
              errorMessage={displayErrorMessage}
              initialInputValue={tabInputValues.convert}
              onInputValueChange={handleTabInputValueChange}
              availableTokens={availableTokens}
              onInputTokenChange={handleInputTokenChange}
              onOutputTokenChange={handleOutputTokenChange}
            />
          ) : null}

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

          {hasSufficientBalance &&
          (activeTab !== 'convert' || !isArtistCoinsEnabled) ? (
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
            selectedPair={safeSelectedPair}
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
              setTabInputValues({ buy: '', sell: '', convert: '' })
            }}
          />
        ) : null}
      </Flex>
    </>
  )
}
