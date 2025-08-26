import React, { useMemo } from 'react'

import { buySellMessages as messages } from '@audius/common/messages'
import type { TokenAmountSectionProps, TokenInfo } from '@audius/common/store'
import { useTokenAmountFormatting } from '@audius/common/store'
import { Image } from 'react-native'

import {
  Button,
  Flex,
  HexagonalIcon,
  IconLogoCircleUSDC,
  Text,
  TextInput,
  useTheme
} from '@audius/harmony-native'

import { TooltipInfoIcon } from './TooltipInfoIcon'

const toUSD = (price: string) => {
  return `$${price}`
}

/**
 * Sanitizes numeric input by removing invalid characters but preserves the user's intended value
 */
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

type BalanceSectionProps = {
  isStablecoin?: boolean
  formattedAvailableBalance: string | null
  tokenInfo: TokenInfo
}

const DefaultBalanceSection = ({
  isStablecoin,
  formattedAvailableBalance,
  tokenInfo
}: BalanceSectionProps) => {
  const { logoURI, symbol } = tokenInfo
  const TokenIcon = symbol === 'USDC' ? IconLogoCircleUSDC : null
  const { iconSizes } = useTheme()
  const iconSize = iconSizes.l

  if (!formattedAvailableBalance || (!TokenIcon && !logoURI)) {
    return null
  }

  return (
    <Flex
      direction='column'
      alignItems='flex-end'
      justifyContent='center'
      gap='xs'
    >
      <Flex direction='row' alignItems='center' gap='s'>
        {TokenIcon ? (
          <TokenIcon size='l' />
        ) : (
          <HexagonalIcon size={iconSize}>
            <Image
              source={{ uri: logoURI }}
              style={{ width: iconSize, height: iconSize }}
            />
          </HexagonalIcon>
        )}
        <Text variant='title' size='l' color='subdued'>
          {messages.available}
        </Text>
        <TooltipInfoIcon />
      </Flex>
      <Text variant='heading' size='l'>
        {isStablecoin ? '$' : ''}
        {formattedAvailableBalance}
      </Text>
    </Flex>
  )
}

const StackedBalanceSection = ({
  formattedAvailableBalance,
  tokenInfo,
  isStablecoin
}: BalanceSectionProps) => {
  const { symbol, logoURI } = tokenInfo
  const { iconSizes } = useTheme()
  const iconSize = iconSizes['4xl']
  const TokenIcon = symbol === 'USDC' ? IconLogoCircleUSDC : null

  if (!formattedAvailableBalance || !logoURI) {
    return null
  }

  return (
    <Flex direction='row' alignItems='center' gap='s'>
      <Flex direction='column' alignItems='flex-end'>
        <Text variant='heading' size='s' color='subdued'>
          {messages.tokenTicker(symbol, !!isStablecoin)}
        </Text>
        <Text variant='title' size='s' color='default'>
          {messages.stackedBalance(formattedAvailableBalance)}
        </Text>
      </Flex>
      {TokenIcon ? (
        <TokenIcon size='l' />
      ) : (
        <HexagonalIcon size={iconSize}>
          <Image
            source={{ uri: logoURI }}
            style={{ width: iconSize, height: iconSize }}
          />
        </HexagonalIcon>
      )}
    </Flex>
  )
}

const CryptoAmountSection = ({
  formattedAmount,
  tokenInfo,
  isStablecoin,
  priceDisplay
}: {
  formattedAmount: string
  tokenInfo: TokenInfo
  isStablecoin: boolean
  priceDisplay?: string
}) => {
  const { symbol, logoURI } = tokenInfo
  const { iconSizes } = useTheme()
  const iconSize = iconSizes['4xl']
  const TokenIcon = symbol === 'USDC' ? IconLogoCircleUSDC : null
  const tokenTicker = messages.tokenTicker(symbol, !!isStablecoin)

  if (!logoURI) {
    return null
  }

  return (
    <Flex direction='row' alignItems='center' gap='s'>
      {TokenIcon ? (
        <TokenIcon size='l' />
      ) : (
        <HexagonalIcon size={iconSize}>
          <Image
            source={{ uri: logoURI }}
            style={{ width: iconSize, height: iconSize }}
          />
        </HexagonalIcon>
      )}
      <Flex direction='column'>
        <Flex direction='row' alignItems='center' gap='xs'>
          <Text variant='heading' size='l'>
            {formattedAmount}
          </Text>
          <Text variant='heading' size='l' color='subdued'>
            {tokenTicker}
          </Text>
        </Flex>
        {priceDisplay && (
          <Text variant='heading' size='s' color='subdued'>
            {priceDisplay}
          </Text>
        )}
      </Flex>
    </Flex>
  )
}

export const TokenAmountSection = ({
  title,
  tokenInfo,
  isInput,
  amount,
  onAmountChange,
  onMaxClick,
  availableBalance,
  exchangeRate,
  placeholder = '0.00',
  isDefault = true,
  error,
  errorMessage,
  tokenPrice,
  isTokenPriceLoading,
  tokenPriceDecimalPlaces = 2
}: TokenAmountSectionProps) => {
  const { iconSizes, spacing } = useTheme()
  const iconSize = iconSizes.l
  const { symbol, isStablecoin, logoURI } = tokenInfo
  const TokenIcon = symbol === 'USDC' ? IconLogoCircleUSDC : null
  const { formattedAvailableBalance, formattedAmount } =
    useTokenAmountFormatting({
      amount,
      availableBalance,
      exchangeRate,
      isStablecoin: !!isStablecoin,
      decimals: tokenInfo.decimals,
      placeholder
    })

  const priceDisplay =
    tokenPrice && !isTokenPriceLoading
      ? toUSD(messages.tokenPrice(tokenPrice, tokenPriceDecimalPlaces))
      : undefined

  const titleText = useMemo(() => {
    if (isStablecoin && !isInput && (logoURI || TokenIcon)) {
      return (
        <Flex direction='row' alignItems='center' gap='s'>
          {TokenIcon ? (
            <TokenIcon size='l' />
          ) : (
            <HexagonalIcon size={iconSize}>
              <Image
                source={{ uri: logoURI }}
                style={{ width: iconSize, height: iconSize }}
              />
            </HexagonalIcon>
          )}
          <Text variant='heading' size='s' color='subdued'>
            {title}
          </Text>
          <TooltipInfoIcon />
        </Flex>
      )
    }
    return (
      <Text variant='heading' size='s' color='subdued'>
        {title}
      </Text>
    )
  }, [isStablecoin, isInput, logoURI, TokenIcon, title, iconSize])

  const youPaySection = useMemo(() => {
    return (
      <Flex direction='column' gap='l'>
        <Flex
          direction='row'
          justifyContent='space-between'
          alignItems='flex-start'
        >
          <Flex direction='row' alignItems='center' gap='xs'>
            {titleText}
          </Flex>

          {formattedAvailableBalance && (
            <>
              {isDefault ? (
                <DefaultBalanceSection
                  isStablecoin={!!isStablecoin}
                  formattedAvailableBalance={formattedAvailableBalance}
                  tokenInfo={tokenInfo}
                />
              ) : (
                <StackedBalanceSection
                  formattedAvailableBalance={formattedAvailableBalance}
                  tokenInfo={tokenInfo}
                  isStablecoin={!!isStablecoin}
                />
              )}
            </>
          )}
        </Flex>

        <Flex direction='row' alignItems='center' gap='s'>
          <Flex flex={1}>
            <TextInput
              label={messages.amountInputLabel(symbol)}
              placeholder={placeholder}
              value={amount?.toString() || ''}
              onChangeText={(text) => {
                const sanitizedText = sanitizeNumericInput(text)
                onAmountChange?.(sanitizedText)
              }}
              keyboardType='numeric'
              error={error}
            />
          </Flex>

          {onMaxClick && (
            <Button
              variant='secondary'
              onPress={onMaxClick}
              style={{ height: spacing.unit16 }}
            >
              {messages.max}
            </Button>
          )}
        </Flex>

        {errorMessage && (
          <Text variant='body' size='s' color='danger'>
            {errorMessage}
          </Text>
        )}
      </Flex>
    )
  }, [
    titleText,
    formattedAvailableBalance,
    isDefault,
    isStablecoin,
    tokenInfo,
    symbol,
    placeholder,
    amount,
    onAmountChange,
    error,
    onMaxClick,
    spacing,
    errorMessage
  ])

  const youReceiveSection = useMemo(() => {
    if (!formattedAmount) {
      return null
    }

    if (isStablecoin) {
      return (
        <Text variant='display' size='s'>
          {toUSD(messages.tokenPrice(formattedAmount, 2))}
        </Text>
      )
    }

    return (
      <CryptoAmountSection
        formattedAmount={formattedAmount}
        tokenInfo={tokenInfo}
        isStablecoin={!!isStablecoin}
        priceDisplay={priceDisplay}
      />
    )
  }, [formattedAmount, isStablecoin, priceDisplay, tokenInfo])

  return (
    <Flex direction='column' gap='m'>
      {isInput ? (
        youPaySection
      ) : (
        <Flex direction='column' gap='s'>
          <Flex direction='row' alignItems='center' gap='xs'>
            {titleText}
          </Flex>

          {youReceiveSection}
        </Flex>
      )}
    </Flex>
  )
}
