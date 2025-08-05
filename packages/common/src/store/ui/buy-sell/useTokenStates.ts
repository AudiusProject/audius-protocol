import { useState, useEffect } from 'react'

import { BuySellTab, TokenPair } from '~/store'

export const useTokenStates = (selectedPair: TokenPair | null) => {
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
    quoteToken: 'USDC' // USDC by default for convert tab
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
        quoteToken: prev.quoteToken // Keep USDC for convert tab
      }))
    }
  }, [selectedPair])

  // Get current tab's token symbols
  const getCurrentTabTokens = (activeTab: BuySellTab) => {
    return activeTab === 'buy'
      ? buyTabTokens
      : activeTab === 'sell'
        ? sellTabTokens
        : convertTabTokens
  }

  // Handle token changes
  const handleInputTokenChange = (symbol: string, activeTab: BuySellTab) => {
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
  }

  const handleOutputTokenChange = (symbol: string, activeTab: BuySellTab) => {
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
  }

  return {
    buyTabTokens,
    sellTabTokens,
    convertTabTokens,
    getCurrentTabTokens,
    handleInputTokenChange,
    handleOutputTokenChange
  }
}
