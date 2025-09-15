import React, { useCallback, useEffect, useState } from 'react'

import { useDebouncedCallback } from '@audius/common/hooks'
import { buySellMessages as messages } from '@audius/common/messages'
import type { TokenInfo } from '@audius/common/store'
import { useTokenAmountFormatting } from '@audius/common/store'
import { sanitizeNumericInput } from '@audius/common/utils'

import { Button, Flex, Text, TextInput, useTheme } from '@audius/harmony-native'

import { TokenIcon } from '../core'

import { TokenDropdownSelect } from './TokenDropdownSelect'
import { TooltipInfoIcon } from './TooltipInfoIcon'

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
  availableTokens
}: InputTokenSectionProps) => {
  const { logoURI } = tokenInfo
  const { iconSizes } = useTheme()
  const iconSize = iconSizes.s
  const { spacing } = useTheme()
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
    <Flex column gap='s'>
      <Flex row justifyContent='space-between' alignItems='flex-start'>
        <Flex row alignItems='center' gap='xs'>
          <Text variant='title' size='l'>
            {title}
          </Text>
        </Flex>

        {formattedAvailableBalance ? (
          <Flex row alignItems='center' justifyContent='center' gap='xs'>
            <TokenIcon logoURI={logoURI} size={iconSize} />
            <Text strength='strong'>
              {messages.formattedAvailableBalance(
                formattedAvailableBalance,
                symbol,
                !!isStablecoin
              )}
            </Text>
            <TooltipInfoIcon />
          </Flex>
        ) : null}
      </Flex>

      <Flex row alignItems='center' gap='s'>
        {displayTokenDropdown ? (
          <Flex flex={1}>
            <TokenDropdownSelect
              selectedToken={tokenInfo}
              navigationRoute='BaseTokenDropdownSelect'
            />
          </Flex>
        ) : null}

        {!displayTokenDropdown ? (
          <Flex flex={1}>
            <TextInput
              label={messages.amountInputLabel(symbol)}
              hideLabel
              placeholder={placeholder}
              startAdornmentText={isStablecoin ? '$' : ''}
              endAdornmentText={symbol}
              value={localAmount}
              onChangeText={handleTextChange}
              keyboardType='numeric'
              error={error}
            />
          </Flex>
        ) : null}

        {onMaxClick ? (
          <Button
            variant='secondary'
            onPress={onMaxClick}
            style={{ height: spacing.unit16 }}
          >
            {messages.max}
          </Button>
        ) : null}
      </Flex>

      {displayTokenDropdown ? (
        <Flex flex={1}>
          <TextInput
            label={messages.amountInputLabel(symbol)}
            hideLabel
            placeholder={placeholder}
            startAdornmentText={isStablecoin ? '$' : ''}
            endAdornmentText={symbol}
            value={localAmount}
            onChangeText={handleTextChange}
            keyboardType='numeric'
            error={error}
          />
        </Flex>
      ) : null}

      {errorMessage && (
        <Text variant='body' size='s' color='danger'>
          {errorMessage}
        </Text>
      )}
    </Flex>
  )
}
