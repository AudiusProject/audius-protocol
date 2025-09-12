import React, { useCallback, useEffect, useState } from 'react'

import { useDebouncedCallback } from '@audius/common/hooks'
import { buySellMessages as messages } from '@audius/common/messages'
import type { TokenInfo } from '@audius/common/store'
import { useTokenAmountFormatting } from '@audius/common/store'
import {
  Button,
  Flex,
  Text,
  TextInput,
  IconInfo,
  TextInputSize
} from '@audius/harmony'

import { Tooltip } from 'components/tooltip'

import { TokenIcon } from '../TokenIcon'

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

type InputTokenSectionProps = {
  title: string
  tokenInfo: TokenInfo
  amount: string
  onAmountChange: (amount: string) => void
  onMaxClick: () => void
  availableBalance: number
  exchangeRate?: number | null
  placeholder?: string
  error?: boolean
  errorMessage?: string
  tokenPrice?: string | null
  isTokenPriceLoading?: boolean
  tokenPriceDecimalPlaces?: number
  availableTokens?: TokenInfo[]
  onTokenChange?: (token: TokenInfo) => void
}

export const InputTokenSection = ({
  title,
  tokenInfo,
  amount,
  onAmountChange,
  onMaxClick,
  availableBalance,
  exchangeRate,
  placeholder = '0.00',
  error,
  errorMessage,
  availableTokens,
  onTokenChange
}: InputTokenSectionProps) => {
  const { symbol, isStablecoin } = tokenInfo
  const [localAmount, setLocalAmount] = useState(amount || '')

  const { formattedAvailableBalance } = useTokenAmountFormatting({
    amount,
    availableBalance,
    exchangeRate,
    isStablecoin: !!isStablecoin,
    decimals: tokenInfo.decimals,
    placeholder
  })

  const displayTokenDropdown = availableTokens && availableTokens.length > 0

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
      <Flex justifyContent='space-between' alignItems='center'>
        <Text variant='title' size='l' color='default'>
          {title}
        </Text>

        {formattedAvailableBalance ? (
          <Flex alignItems='center' gap='xs'>
            <TokenIcon
              logoURI={tokenInfo.logoURI}
              icon={tokenInfo.icon}
              size='s'
              hex
            />
            <Text variant='body' size='m' strength='strong'>
              {`${isStablecoin ? '$' : ''}${formattedAvailableBalance} ${messages.available}`}
            </Text>
            <Tooltip text='This is the amount you have available to spend'>
              <IconInfo color='subdued' size='s' />
            </Tooltip>
          </Flex>
        ) : null}
      </Flex>

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

          {displayTokenDropdown ? (
            <Flex css={{ minWidth: '60px' }}>
              <TokenDropdown
                selectedToken={tokenInfo}
                availableTokens={availableTokens || []}
                onTokenChange={onTokenChange || (() => {})}
              />
            </Flex>
          ) : null}

          {onMaxClick ? (
            <Button variant='secondary' size='large' onClick={onMaxClick}>
              {messages.max}
            </Button>
          ) : null}
        </Flex>

        {errorMessage && (
          <Text variant='body' size='s' color='danger'>
            {errorMessage}
          </Text>
        )}
      </Flex>
    </Flex>
  )
}
