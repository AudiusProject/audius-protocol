import { useState, useEffect, useContext, useMemo } from 'react'

import { useBuySellAnalytics } from '@audius/common/hooks'
import { buySellMessages as messages } from '@audius/common/messages'
import { FeatureFlags } from '@audius/common/services'
import { SwapStatus } from '@audius/common/src/api/tan-query/jupiter/types'
import { ASSET_DETAIL_PAGE } from '@audius/common/src/utils/route'
import {
  useBuySellScreen,
  useBuySellSwap,
  useBuySellTabs,
  useBuySellTransactionData,
  useSwapDisplayData,
  BuySellTab,
  Screen,
  useTokenStates,
  useCurrentTokenPair,
  useSupportedTokenPairs,
  useTokens,
  TokenInfo
} from '@audius/common/store'
import { Button, Flex, SegmentedControl } from '@audius/harmony'
import { matchPath, useLocation } from 'react-router-dom'

import { ModalLoading } from 'components/modal-loading'
import { ToastContext } from 'components/toast/ToastContext'
import { useFlag } from 'hooks/useRemoteConfig'
import { getPathname } from 'utils/route'

import { BuyTab } from './BuyTab'
import { ConfirmSwapScreen } from './ConfirmSwapScreen'
import { TransactionSuccessScreen } from './TransactionSuccessScreen'
import { SwapFormState } from './types'

// const WALLET_GUIDE_URL = 'https://help.audius.co/product/wallet-guide'

type BuySellModalContentProps = {
  onClose: () => void
  onScreenChange: (screen: Screen) => void
  onLoadingStateChange?: (isLoading: boolean) => void
}

export const BuySellModalContent = (props: BuySellModalContentProps) => {
  const { onClose, onScreenChange, onLoadingStateChange } = props
  const { toast } = useContext(ToastContext)
  const { isEnabled: isArtistCoinsEnabled } = useFlag(FeatureFlags.ARTIST_COINS)
  const { trackSwapRequested, trackSwapSuccess, trackSwapFailure } =
    useBuySellAnalytics()

  // Get tokens and token pairs from API
  const { tokens, isLoading: tokensLoading } = useTokens()
  const { pairs: supportedTokenPairs, isLoading: pairsLoading } =
    useSupportedTokenPairs()

  const isTokenDataLoading = tokensLoading || pairsLoading

  const { currentScreen, setCurrentScreen } = useBuySellScreen({
    onScreenChange
  })

  const { transactionData, resetTransactionData } = useBuySellTransactionData()

  const { activeTab, handleActiveTabChange } = useBuySellTabs({
    setCurrentScreen,
    resetTransactionData
  })

  const [tabFormState, setTabFormState] = useState<
    Record<BuySellTab, SwapFormState | {}>
  >({
    buy: {},
    sell: {},
    convert: {}
  })

  const location = useLocation()
  const pathname = getPathname(location)
  const match = matchPath<{ mint: string }>(pathname, {
    path: ASSET_DETAIL_PAGE,
    exact: true
  })
  const pairFromLocation =
    match?.params.mint &&
    supportedTokenPairs.find(
      (pair) =>
        pair.baseToken.address === match.params.mint &&
        pair.quoteToken.symbol === 'USDC'
    )

  const selectedPair = pairFromLocation || supportedTokenPairs[0]

  // Use custom hooks for token state management
  const {
    getCurrentTabTokens,
    handleInputTokenChange: handleInputTokenChangeInternal,
    handleOutputTokenChange: handleOutputTokenChangeInternal
  } = useTokenStates(selectedPair)

  // Get current tab's token symbols
  const currentTabTokens = getCurrentTabTokens(activeTab)
  const baseTokenSymbol = currentTabTokens.baseToken
  const quoteTokenSymbol = currentTabTokens.quoteToken

  // Handle token changes with transaction reset
  const handleInputTokenChange = (symbol: string) => {
    handleInputTokenChangeInternal(symbol, activeTab)
    resetTransactionData()
  }

  const handleOutputTokenChange = (symbol: string) => {
    handleOutputTokenChangeInternal(symbol, activeTab)
    resetTransactionData()
  }

  // Get all available tokens for swapping based on supported token pairs
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
  const currentTokenPair = useCurrentTokenPair({
    baseTokenSymbol,
    quoteTokenSymbol,
    availableTokens,
    selectedPair,
    supportedTokenPairs
  })

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
    swapError,
    swapData,
    isRetrying
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
    // Handle swap data errors (returned error status) - only show toast after retries are exhausted
    if (
      swapData?.status === SwapStatus.ERROR &&
      swapData?.error &&
      !isRetrying
    ) {
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
          errorMessage: swapData.error.message
            ? swapData.error.message.substring(0, 500)
            : 'Unknown error'
        }
      )

      toast(messages.transactionFailed, 5000)
    }
  }, [
    swapStatus,
    swapError,
    swapData,
    isRetrying,
    toast,
    activeTab,
    transactionData,
    swapTokens,
    currentExchangeRate,
    trackSwapFailure
  ])

  // Set up navigation tabs
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

  if (isConfirmButtonLoading && currentScreen !== 'success') {
    return <ModalLoading />
  }

  if (isTokenDataLoading) {
    return <ModalLoading noText />
  }

  return (
    <>
      <Flex
        direction='column'
        style={{ display: currentScreen === 'input' ? 'flex' : 'none' }}
      >
        <Flex direction='column' gap='xl'>
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
              onOutputTokenTypeChange={handleOutputTokenChange}
              onFormStateChange={setTabFormState}
              onFormSubmit={handleContinueClick}
            />
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

      {currentScreen === 'confirm' && confirmationScreenData ? (
        <Flex direction='column'>
          <ConfirmSwapScreen
            {...confirmationScreenData}
            onBack={() => setCurrentScreen('input')}
            onConfirm={handleConfirmSwap}
            isConfirming={isConfirmButtonLoading}
            activeTab={activeTab}
            selectedPair={safeSelectedPair}
          />
        </Flex>
      ) : null}

      {currentScreen === 'success' && successDisplayData ? (
        <Flex direction='column'>
          <TransactionSuccessScreen
            {...successDisplayData}
            onDone={() => {
              onClose()
            }}
          />
        </Flex>
      ) : null}
    </>
  )
}
