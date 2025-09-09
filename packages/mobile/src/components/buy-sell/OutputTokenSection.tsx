import React, { useCallback, useEffect, useState } from 'react'

import { useDebouncedCallback } from '@audius/common/hooks'
import { buySellMessages as messages } from '@audius/common/messages'
import type { TokenInfo } from '@audius/common/store'

import { Flex, Text, TextInput } from '@audius/harmony-native'

import { TokenDropdownSelect } from './TokenDropdownSelect'
import { sanitizeNumericInput } from './utils'

type OutputTokenSectionProps = {
  tokenInfo: TokenInfo
  amount: string
  availableBalance: number
  exchangeRate?: number | null
  tokenPrice?: string | null
  isTokenPriceLoading?: boolean
  tokenPriceDecimalPlaces?: number
  placeholder?: string
  error?: boolean
  onAmountChange?: (amount: string) => void
  onTokenChange?: (token: TokenInfo) => void
  availableTokens?: TokenInfo[]
}

export const OutputTokenSection = ({
  tokenInfo,
  amount,
  placeholder = '0.00',
  error,
  onAmountChange,
  availableTokens
}: OutputTokenSectionProps) => {
  const { symbol, isStablecoin } = tokenInfo
  const [localAmount, setLocalAmount] = useState(amount || '')

  // Sync local state with prop changes
  useEffect(() => {
    setLocalAmount(amount || '')
  }, [amount])

  const debouncedOnAmountChange = useDebouncedCallback(
    (amount: string) => onAmountChange?.(amount),
    [onAmountChange],
    300
  )

  const handleTextChange = useCallback(
    (text: string) => {
      const sanitizedText = sanitizeNumericInput(text)
      setLocalAmount(sanitizedText)
      debouncedOnAmountChange(sanitizedText)
    },
    [debouncedOnAmountChange]
  )

  return (
    <Flex column gap='s'>
      <Flex row alignItems='center' gap='xs'>
        <Text variant='title' size='l'>
          {messages.youReceive}
        </Text>
      </Flex>
      <Flex column alignItems='center' gap='s'>
        <Flex flex={1}>
          <TextInput
            label={messages.amountInputLabel(symbol)}
            hideLabel
            placeholder={placeholder}
            startAdornmentText={isStablecoin ? '$' : ''}
            endAdornmentText={symbol}
            // value={amount}
            value={localAmount}
            onChangeText={handleTextChange}
            keyboardType='numeric'
            error={error}
            // editable={false}
          />
        </Flex>
        {availableTokens && availableTokens.length > 0 && (
          <Flex flex={1}>
            <TokenDropdownSelect
              selectedToken={tokenInfo}
              navigationRoute='BaseTokenDropdownSelect'
            />
          </Flex>
        )}
      </Flex>
    </Flex>
  )
}
