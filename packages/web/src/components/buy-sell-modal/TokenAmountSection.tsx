import { useMemo, useCallback, useState, useRef } from 'react'

import { buySellMessages as messages } from '@audius/common/messages'
import { FeatureFlags } from '@audius/common/services'
import { TokenAmountSectionProps, TokenInfo } from '@audius/common/store'
import {
  Button,
  Divider,
  Flex,
  IconCaretDown,
  IconTransaction,
  Text,
  TextInput,
  TokenAmountInput,
  TokenAmountInputChangeHandler,
  Popup,
  Artwork
} from '@audius/harmony'
import { useTheme } from '@emotion/react'
import { TooltipPlacement } from 'antd/lib/tooltip'

import { useFlag } from '../../hooks/useRemoteConfig'

import { TooltipInfoIcon } from './TooltipInfoIcon'
import { useTokenAmountFormatting } from './hooks'

// Component to render token icon - handles both icon component and logoURI
const TokenIcon = ({
  tokenInfo,
  size = 'l',
  ...props
}: {
  tokenInfo: TokenInfo
  size?: string
  [key: string]: any
}) => {
  const { spacing } = useTheme()
  const { icon: IconComponent, logoURI } = tokenInfo

  if (IconComponent) {
    return <IconComponent size={size} {...props} />
  }

  if (logoURI) {
    // Handle different size props for Artwork component
    const sizeMap: Record<string, { w: number; h: number }> = {
      l: { w: spacing.unit6, h: spacing.unit6 },
      '4xl': { w: spacing.unit16, h: spacing.unit16 }
    }

    const dimensions = sizeMap[size] || { w: spacing.unit6, h: spacing.unit6 }

    return <Artwork src={logoURI} {...dimensions} borderWidth={0} {...props} />
  }

  return null
}

type BalanceSectionProps = {
  isStablecoin?: boolean
  formattedAvailableBalance: string | null
  tokenInfo: TokenInfo
  tooltipPlacement?: TooltipPlacement
  availableTokens?: TokenInfo[]
  onTokenChange?: (symbol: string) => void
  isConvertFlow?: boolean
}

const DefaultBalanceSection = ({
  isStablecoin,
  formattedAvailableBalance,
  tokenInfo,
  tooltipPlacement
}: BalanceSectionProps) => {
  const { cornerRadius } = useTheme()

  if (!formattedAvailableBalance || (!tokenInfo.icon && !tokenInfo.logoURI)) {
    return null
  }

  return (
    <Flex
      direction='column'
      alignItems='flex-end'
      justifyContent='center'
      gap='xs'
      flex={1}
      alignSelf='stretch'
    >
      <Flex alignItems='center' gap='xs'>
        <TokenIcon
          tokenInfo={tokenInfo}
          size='l'
          css={{ borderRadius: cornerRadius.circle }}
        />
        <Text variant='heading' size='s' color='subdued'>
          {messages.available}
        </Text>
        <TooltipInfoIcon
          ariaLabel='Available balance'
          placement={tooltipPlacement}
        />
      </Flex>
      <Text variant='heading' size='xl'>
        {isStablecoin ? '$' : ''}
        {formattedAvailableBalance}
      </Text>
    </Flex>
  )
}

const TokenSelectionPopup = ({
  availableTokens,
  onTokenSelect,
  onClose
}: {
  availableTokens: TokenInfo[]
  onTokenSelect: (symbol: string) => void
  onClose: () => void
}) => {
  const { spacing, color } = useTheme()

  const handleTokenClick = useCallback(
    (symbol: string) => {
      onTokenSelect(symbol)
      onClose()
    },
    [onTokenSelect, onClose]
  )

  return (
    <Flex direction='column' gap='xs' p='s'>
      {availableTokens.map((token) => {
        const { symbol, name } = token

        if (!token.icon && !token.logoURI) return null

        return (
          <Button
            key={symbol}
            variant='tertiary'
            onClick={() => handleTokenClick(symbol)}
            css={{
              justifyContent: 'flex-start',
              padding: spacing.s,
              '&:hover': {
                backgroundColor: color.background.surface2
              }
            }}
          >
            <Flex gap='s' alignItems='center'>
              <TokenIcon tokenInfo={token} size='l' hex />
              <Flex direction='column' alignItems='flex-start'>
                <Text variant='body' size='s' strength='strong'>
                  {symbol}
                </Text>
                <Text variant='body' size='xs' color='subdued'>
                  {name}
                </Text>
              </Flex>
            </Flex>
          </Button>
        )
      })}
    </Flex>
  )
}

const StackedBalanceSection = ({
  formattedAvailableBalance,
  tokenInfo,
  isStablecoin,
  availableTokens,
  onTokenChange,
  isConvertFlow = false
}: BalanceSectionProps) => {
  const { symbol } = tokenInfo
  const [isPopupVisible, setIsPopupVisible] = useState(false)
  const anchorRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (availableTokens && availableTokens.length > 0) {
      setIsPopupVisible(true)
    }
  }, [availableTokens])

  const handleTokenSelect = useCallback(
    (selectedSymbol: string) => {
      onTokenChange?.(selectedSymbol)
      setIsPopupVisible(false)
    },
    [onTokenChange]
  )

  const handlePopupClose = useCallback(() => {
    setIsPopupVisible(false)
  }, [])

  if (!formattedAvailableBalance || (!tokenInfo.icon && !tokenInfo.logoURI)) {
    return null
  }

  const isClickable = availableTokens && availableTokens.length > 0

  return (
    <>
      <Flex
        ref={anchorRef}
        direction='column'
        alignItems='flex-start'
        justifyContent='center'
        gap='xs'
        flex={isConvertFlow ? undefined : 1}
        alignSelf={isConvertFlow ? 'flex-end' : 'stretch'}
        border='default'
        pv='s'
        ph='m'
        borderRadius='s'
        onClick={isClickable ? handleClick : undefined}
        css={{
          cursor: isClickable ? 'pointer' : 'default',
          '&:hover': isClickable
            ? {
                backgroundColor: 'var(--harmony-n-50)'
              }
            : undefined
        }}
      >
        <Flex
          gap='s'
          alignItems='center'
          justifyContent='space-between'
          w='100%'
        >
          <Flex gap='s' alignItems='center'>
            <TokenIcon tokenInfo={tokenInfo} size='4xl' hex />
            <Flex direction='column'>
              <Flex alignSelf='flex-start'>
                <Text variant='heading' size='s' color='subdued'>
                  {messages.tokenTicker(symbol, !!isStablecoin)}
                </Text>
              </Flex>
              <Text variant='title' size='s' color='default'>
                {messages.stackedBalance(formattedAvailableBalance)}
              </Text>
            </Flex>
          </Flex>
          <IconCaretDown size='s' color='default' />
        </Flex>
      </Flex>

      {isClickable && (
        <Popup
          isVisible={isPopupVisible}
          onClose={handlePopupClose}
          anchorRef={anchorRef}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        >
          <TokenSelectionPopup
            availableTokens={availableTokens}
            onTokenSelect={handleTokenSelect}
            onClose={handlePopupClose}
          />
        </Popup>
      )}
    </>
  )
}

const OldStackedBalanceSection = ({
  formattedAvailableBalance,
  tokenInfo,
  isStablecoin
}: BalanceSectionProps) => {
  const { symbol } = tokenInfo

  if (!formattedAvailableBalance || (!tokenInfo.icon && !tokenInfo.logoURI)) {
    return null
  }

  return (
    <Flex
      direction='column'
      alignItems='flex-end'
      justifyContent='center'
      gap='xs'
      flex={1}
      alignSelf='stretch'
    >
      <Flex gap='s' alignItems='center'>
        <Flex direction='column'>
          <Flex alignSelf='flex-end'>
            <Text variant='heading' size='s' color='subdued'>
              {messages.tokenTicker(symbol, !!isStablecoin)}
            </Text>
          </Flex>
          <Text variant='title' size='s' color='default'>
            {messages.stackedBalance(formattedAvailableBalance)}
          </Text>
        </Flex>
        <TokenIcon tokenInfo={tokenInfo} size='4xl' hex />
      </Flex>
    </Flex>
  )
}

const CryptoAmountSection = ({
  formattedAmount,
  tokenInfo,
  isStablecoin,
  priceDisplay,
  noPadding = false,
  verticalLayout = false
}: {
  formattedAmount: string
  tokenInfo: TokenInfo
  isStablecoin: boolean
  priceDisplay?: string
  noPadding?: boolean
  verticalLayout?: boolean
}) => {
  const { spacing } = useTheme()
  const { symbol } = tokenInfo
  const tokenTicker = messages.tokenTicker(symbol, !!isStablecoin)

  if (!tokenInfo.icon && !tokenInfo.logoURI) {
    return null
  }

  if (verticalLayout) {
    return (
      <Flex p={noPadding ? undefined : 'l'} alignItems='center' gap='s'>
        <TokenIcon
          tokenInfo={tokenInfo}
          width={spacing.unit16}
          height={spacing.unit16}
          hex
        />
        <Flex direction='column'>
          <Text variant='heading' size='l'>
            {formattedAmount}
          </Text>
          <Text variant='heading' size='s' color='subdued'>
            {tokenTicker}
          </Text>
          {priceDisplay && (
            <Text variant='heading' size='s' color='subdued'>
              {priceDisplay}
            </Text>
          )}
        </Flex>
      </Flex>
    )
  }

  return (
    <Flex p={noPadding ? undefined : 'l'} alignItems='center' gap='s'>
      <TokenIcon
        tokenInfo={tokenInfo}
        width={spacing.unit16}
        height={spacing.unit16}
        hex
      />
      <Flex direction='column'>
        <Flex gap='xs' justifyContent='center' alignItems='center'>
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
  tokenPriceDecimalPlaces = 2,
  tooltipPlacement,
  availableTokens,
  onTokenChange
}: TokenAmountSectionProps & {
  availableTokens?: TokenInfo[]
  onTokenChange?: (symbol: string) => void
}) => {
  const { spacing } = useTheme()
  const { isEnabled: isArtistCoinsEnabled } = useFlag(FeatureFlags.ARTIST_COINS)

  const { symbol, isStablecoin } = tokenInfo

  const { formattedAvailableBalance, formattedAmount } =
    useTokenAmountFormatting({
      amount,
      availableBalance,
      exchangeRate,
      isStablecoin: !!isStablecoin,
      placeholder
    })

  const priceDisplay =
    tokenPrice && !isTokenPriceLoading
      ? messages.tokenPrice(tokenPrice, tokenPriceDecimalPlaces)
      : undefined

  const handleTokenAmountChange: TokenAmountInputChangeHandler = useCallback(
    (value) => {
      onAmountChange?.(value)
    },
    [onAmountChange]
  )

  const youPaySection = useMemo(() => {
    return (
      <Flex gap='s' p='l' alignItems='flex-start'>
        <Flex direction='column' gap='xs' alignItems='flex-start'>
          <Flex alignItems='flex-start' gap='s'>
            {isStablecoin ? (
              <TextInput
                label={messages.amountInputLabel(symbol)}
                placeholder={placeholder}
                value={amount?.toString() || ''}
                onChange={(e) => onAmountChange?.(e.target.value)}
                error={error}
              />
            ) : (
              <TokenAmountInput
                label={messages.amountInputLabel(symbol)}
                placeholder={placeholder}
                value={amount?.toString() || ''}
                onChange={handleTokenAmountChange}
                tokenLabel={symbol}
                decimals={tokenInfo.decimals}
                error={error}
              />
            )}
            <Button
              variant='secondary'
              css={{
                height: spacing.unit16
              }}
              onClick={onMaxClick}
            >
              {messages.max}
            </Button>
          </Flex>
          {isInput && !!errorMessage ? (
            <Text size='xs' variant='body' color='danger'>
              {errorMessage}
            </Text>
          ) : null}
        </Flex>
        {isDefault ? (
          <DefaultBalanceSection
            isStablecoin={!!isStablecoin}
            formattedAvailableBalance={formattedAvailableBalance}
            tokenInfo={tokenInfo}
            tooltipPlacement={tooltipPlacement}
          />
        ) : isArtistCoinsEnabled ? (
          <StackedBalanceSection
            formattedAvailableBalance={formattedAvailableBalance}
            tokenInfo={tokenInfo}
            isStablecoin={!!isStablecoin}
            availableTokens={availableTokens}
            onTokenChange={onTokenChange}
          />
        ) : (
          <OldStackedBalanceSection
            formattedAvailableBalance={formattedAvailableBalance}
            tokenInfo={tokenInfo}
            isStablecoin={!!isStablecoin}
          />
        )}
      </Flex>
    )
  }, [
    amount,
    error,
    errorMessage,
    formattedAvailableBalance,
    handleTokenAmountChange,
    isDefault,
    isInput,
    isStablecoin,
    onAmountChange,
    onMaxClick,
    placeholder,
    spacing,
    symbol,
    tokenInfo,
    tooltipPlacement,
    availableTokens,
    onTokenChange,
    isArtistCoinsEnabled
  ])

  const youReceiveSection = useMemo(() => {
    if (!formattedAmount) {
      return null
    }

    if (isStablecoin) {
      return (
        <Text variant='display' size='s'>
          {messages.tokenPrice(formattedAmount, 2)}
        </Text>
      )
    }

    // For convert flow, show the amount with token selection on the right
    if (
      !isDefault &&
      availableTokens &&
      onTokenChange &&
      isArtistCoinsEnabled
    ) {
      return (
        <Flex p='l' alignItems='center' gap='s' justifyContent='space-between'>
          <CryptoAmountSection
            formattedAmount={formattedAmount}
            tokenInfo={tokenInfo}
            isStablecoin={!!isStablecoin}
            priceDisplay={priceDisplay}
            noPadding
            verticalLayout
          />
          <StackedBalanceSection
            formattedAvailableBalance={formattedAvailableBalance}
            tokenInfo={tokenInfo}
            isStablecoin={!!isStablecoin}
            availableTokens={availableTokens}
            onTokenChange={onTokenChange}
            isConvertFlow={true}
          />
        </Flex>
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
  }, [
    formattedAmount,
    isStablecoin,
    priceDisplay,
    tokenInfo,
    isDefault,
    availableTokens,
    onTokenChange,
    formattedAvailableBalance,
    isArtistCoinsEnabled
  ])

  const titleText = useMemo(() => {
    if (isStablecoin && !isInput && (tokenInfo.icon || tokenInfo.logoURI)) {
      return (
        <Flex alignItems='center' gap='s'>
          <TokenIcon tokenInfo={tokenInfo} size='l' />
          <Text variant='heading' size='s' color='subdued'>
            {title}
          </Text>
          <TooltipInfoIcon
            ariaLabel='You receive'
            placement={tooltipPlacement}
          />
        </Flex>
      )
    }

    // Add transaction icon for "You Receive" title in convert flow only
    if (!isInput && title === messages.youReceive && !isDefault) {
      return (
        <Flex alignItems='center' gap='s'>
          <IconTransaction size='s' color='subdued' />
          <Text variant='heading' size='s' color='subdued'>
            {title}
          </Text>
        </Flex>
      )
    }

    return (
      <Text variant='heading' size='s' color='subdued'>
        {title}
      </Text>
    )
  }, [tokenInfo, isInput, isStablecoin, title, tooltipPlacement, isDefault])

  return (
    <Flex direction='column' gap='m'>
      <Flex alignItems='center' justifyContent='center' gap='m'>
        {titleText}
        <Divider css={{ flexGrow: 1 }} />
      </Flex>
      {isInput ? youPaySection : youReceiveSection}
    </Flex>
  )
}
