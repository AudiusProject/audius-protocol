import React, { useCallback, useEffect, useState } from 'react'

import { useDebouncedCallback } from '@audius/common/hooks'
import { buySellMessages as messages } from '@audius/common/messages'
import type { TokenInfo } from '@audius/common/store'
import { Flex, Text, TextInput, TextInputSize } from '@audius/harmony'

import { TokenDropdown } from './TokenDropdown'

// Utility function to sanitize numeric input
const sanitizeNumericInput = (input: string): string => {
  // Remove any non-numeric characters except decimal point
  const cleaned = input.replace(/[^0-9.]/g, '')

  // Handle multiple decimal points - keep only the first one
  const parts = cleaned.split('.')
  if (parts.length > 2) {
    return parts[0] + '.' + parts.slice(1).join('')
  }

  return cleaned
}

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
  availableTokens,
  onTokenChange
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
    <Flex direction='column' gap='m'>
      <Text variant='title' size='l' color='default'>
        {messages.youReceive}
      </Text>

      <Flex direction='column' gap='s'>
        <Flex alignItems='center' gap='s'>
          <Flex flex={1}>
            <TextInput
              label={messages.amountInputLabel(symbol)}
              hideLabel
              placeholder={placeholder}
              startAdornmentText={isStablecoin ? '$' : ''}
              endAdornmentText={symbol}
              value={localAmount}
              onChange={(e) => handleTextChange(e.target.value)}
              type='number'
              error={error}
              size={TextInputSize.DEFAULT}
            />
          </Flex>

          {availableTokens && availableTokens.length > 0 ? (
            <Flex css={{ minWidth: '60px' }}>
              <TokenDropdown
                selectedToken={tokenInfo}
                availableTokens={availableTokens}
                onTokenChange={onTokenChange || (() => {})}
              />
            </Flex>
          ) : (
            <Flex
              alignItems='center'
              css={{ minWidth: '60px', padding: '0 12px' }}
            >
              <Text variant='body' size='m' color='subdued'>
                {symbol}
              </Text>
            </Flex>
          )}
        </Flex>
      </Flex>
    </Flex>
  )
}
