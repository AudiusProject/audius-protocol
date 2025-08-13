import { useMemo, useCallback, useRef } from 'react'

import { buySellMessages as messages } from '@audius/common/messages'
import {
  DEFAULT_TOKEN_AMOUNT_PLACEHOLDER,
  TokenInfo
} from '@audius/common/store'
import { Flex, IconCaretDown, Text } from '@audius/harmony'
import { useTheme, css } from '@emotion/react'
import Select, { components } from 'react-select'
import type { SingleValue, SingleValueProps, OptionProps } from 'react-select'

import { TokenIcon } from './TokenIcon'

type TokenOption = {
  value: string
  label: string
  tokenInfo: TokenInfo
}

type DropdownSectionProps = {
  isStablecoin?: boolean
  formattedAvailableBalance: string | null
  tokenInfo: TokenInfo
  availableTokens?: TokenInfo[]
  onTokenChange?: (symbol: string) => void
  showReceiveAmount?: boolean
  formattedReceiveAmount?: string
}

type CustomSingleValueProps = {
  symbol: string
  isStablecoin?: boolean
  hasReceiveAmount: boolean
  shouldShowLargeTicker: boolean
  formattedAvailableBalance: string | null
  formattedReceiveAmount?: string
}

const CustomSingleValue = (
  props: SingleValueProps<TokenOption> & CustomSingleValueProps
) => {
  return (
    <components.SingleValue {...props}>
      <Flex gap='s' alignItems='center' justifyContent='space-between' w='100%'>
        <Flex gap='s' alignItems='center'>
          <TokenIcon tokenInfo={props.data.tokenInfo} size='2xl' hex />
          <Flex direction='column'>
            {props.shouldShowLargeTicker ? (
              <Flex alignSelf='flex-start'>
                <Text variant='heading' size='s' color='subdued'>
                  {messages.tokenTicker(props.symbol, !!props.isStablecoin)}
                </Text>
              </Flex>
            ) : null}
            {!props.hasReceiveAmount ? (
              <Text variant='title' size='s' color='default'>
                {messages.stackedBalance(props.formattedAvailableBalance!)}
              </Text>
            ) : null}
            {props.hasReceiveAmount &&
            props.formattedReceiveAmount !==
              DEFAULT_TOKEN_AMOUNT_PLACEHOLDER ? (
              <Flex direction='column'>
                <Text variant='heading' size='s'>
                  {props.formattedReceiveAmount}
                </Text>
                <Text variant='title' size='s' color='subdued'>
                  {messages.tokenTicker(props.symbol, !!props.isStablecoin)}
                </Text>
              </Flex>
            ) : null}
          </Flex>
        </Flex>
      </Flex>
    </components.SingleValue>
  )
}

const CustomOption = (props: OptionProps<TokenOption>) => {
  const { spacing, cornerRadius, color } = useTheme()
  const isSelected = props.isSelected

  return (
    <components.Option {...props}>
      <Flex
        gap='s'
        alignItems='center'
        css={css({
          padding: spacing.s,
          borderRadius: cornerRadius.s,
          minHeight: spacing.unit10,
          width: '100%',
          backgroundColor: isSelected ? color.secondary.s300 : 'transparent',
          color: isSelected ? color.static.white : 'inherit',
          '&:hover': {
            backgroundColor: color.secondary.s300,
            '& *': {
              color: `${color.static.white} !important`
            }
          }
        })}
      >
        <TokenIcon tokenInfo={props.data.tokenInfo} size='l' hex />
        <Text
          variant='body'
          size='s'
          strength='strong'
          color={isSelected ? 'staticWhite' : 'default'}
        >
          {props.data.tokenInfo.symbol}
        </Text>
      </Flex>
    </components.Option>
  )
}

export const DropdownSection = ({
  formattedAvailableBalance,
  tokenInfo,
  isStablecoin,
  availableTokens,
  onTokenChange,
  showReceiveAmount,
  formattedReceiveAmount
}: DropdownSectionProps) => {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const { color, spacing, shadows, cornerRadius } = useTheme()

  const { symbol } = tokenInfo

  const handleTokenSelect = useCallback(
    (option: SingleValue<TokenOption>) => {
      if (option) {
        onTokenChange?.(option.value)
      }
    },
    [onTokenChange]
  )

  // Show component if we have either available balance or receive amount to display
  const hasReceiveAmount = showReceiveAmount && formattedReceiveAmount
  const shouldShowLargeTicker =
    !hasReceiveAmount ||
    formattedReceiveAmount === DEFAULT_TOKEN_AMOUNT_PLACEHOLDER

  const isClickable = !!(availableTokens && availableTokens.length > 0)

  const options: TokenOption[] = useMemo(() => {
    if (!availableTokens) return []
    return availableTokens.map((token) => ({
      value: token.symbol,
      label: token.symbol,
      tokenInfo: token
    }))
  }, [availableTokens])

  const selectedOption = useMemo(
    () =>
      options.find((option) => option.value === symbol) || {
        value: symbol,
        label: symbol,
        tokenInfo
      },
    [options, symbol, tokenInfo]
  )

  if (!formattedAvailableBalance && !hasReceiveAmount) {
    return null
  }

  return (
    <Flex
      ref={wrapperRef}
      direction='column'
      alignItems='flex-start'
      justifyContent='center'
      gap='xs'
      flex={1}
      alignSelf='stretch'
      border='default'
      pv='s'
      ph='m'
      borderRadius='s'
      css={{
        maxHeight: spacing.unit16,
        cursor: isClickable ? 'pointer' : 'default',
        '&:hover': isClickable
          ? {
              backgroundColor: color.background.surface2
            }
          : undefined
      }}
    >
      <Select<TokenOption>
        value={selectedOption}
        onChange={handleTokenSelect}
        options={options}
        isDisabled={!isClickable}
        isSearchable={false}
        components={{
          SingleValue: (props: SingleValueProps<TokenOption>) => {
            const { setValue, ...singleValueProps } = props
            return (
              <CustomSingleValue
                {...singleValueProps}
                setValue={setValue as any}
                symbol={symbol}
                isStablecoin={!!isStablecoin}
                hasReceiveAmount={!!hasReceiveAmount}
                shouldShowLargeTicker={shouldShowLargeTicker}
                formattedAvailableBalance={formattedAvailableBalance}
                formattedReceiveAmount={formattedReceiveAmount}
              />
            )
          },
          Option: (props: OptionProps<TokenOption>) => (
            <CustomOption {...props} />
          ),
          DropdownIndicator: (props) => (
            <components.DropdownIndicator {...props}>
              <IconCaretDown size='s' color='default' />
            </components.DropdownIndicator>
          ),
          IndicatorSeparator: null
        }}
        styles={{
          container: (provided) => ({
            ...provided,
            width: '100%',
            height: '100%'
          }),
          control: (provided) => ({
            ...provided,
            backgroundColor: 'transparent',
            border: 'none',
            boxShadow: 'none',
            minHeight: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            cursor: isClickable ? 'pointer' : 'default',
            '&:hover': {
              border: 'none'
            }
          }),
          menu: (provided) => ({
            ...provided,
            backgroundColor: color.background.white,
            boxShadow: shadows.far,
            borderRadius: cornerRadius.m,
            padding: `${spacing.s} 0`,
            border: `1px solid ${color.border.default}`
          }),
          menuList: (provided) => ({
            ...provided,
            padding: spacing.s,
            maxHeight: 200,
            overflowY: 'auto'
          }),
          option: (provided) => ({
            ...provided,
            backgroundColor: 'transparent',
            color: color.text.default,
            padding: 0,
            '&:hover': {
              backgroundColor: color.background.surface2,
              cursor: 'pointer'
            },
            '&:active': {
              backgroundColor: color.background.surface2
            }
          }),
          singleValue: (provided) => ({
            ...provided,
            margin: 0,
            padding: 0
          }),
          valueContainer: (provided) => ({
            ...provided,
            margin: 0,
            padding: 0
          })
        }}
      />
    </Flex>
  )
}
