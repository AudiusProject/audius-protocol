import React, { useMemo } from 'react'

import type { TokenInfo } from '@audius/common/store'
import {
  PopupMenu,
  IconCaretDown,
  Text,
  Flex,
  Button,
  useTheme,
  PopupMenuProps
} from '@audius/harmony'

import { TokenIcon } from '../TokenIcon'

type TokenDropdownProps = {
  selectedToken: TokenInfo
  availableTokens: TokenInfo[]
  onTokenChange: (token: TokenInfo) => void
  disabled?: boolean
}

export const TokenDropdown = ({
  selectedToken,
  availableTokens,
  onTokenChange,
  disabled = false
}: TokenDropdownProps) => {
  const { spacing } = useTheme()
  const menuItems = useMemo(() => {
    return availableTokens.map((token) => ({
      icon: <TokenIcon logoURI={token.logoURI} icon={token.icon} size='l' />,
      text: (
        <Flex gap='s'>
          <Text
            variant='body'
            size='m'
            strength='strong'
            color='default'
            css={{
              'li:hover &': {
                color: 'white'
              }
            }}
          >
            {token.name}
          </Text>
          <Text
            variant='body'
            size='m'
            strength='strong'
            color='subdued'
            css={{
              'li:hover &': {
                color: 'rgba(255, 255, 255, 0.8)'
              }
            }}
          >
            {token.symbol}
          </Text>
        </Flex>
      ),
      onClick: () => onTokenChange(token)
    }))
  }, [availableTokens, onTokenChange])

  const renderTrigger: PopupMenuProps['renderTrigger'] = (
    anchorRef,
    triggerPopup,
    triggerProps
  ) => (
    <Button
      variant='secondary'
      css={{
        padding: `${spacing.s}px ${spacing.m}px`,
        gap: spacing.m
      }}
      iconLeft={() => (
        <TokenIcon
          logoURI={selectedToken.logoURI}
          icon={selectedToken.icon}
          size='2xl'
          hex
        />
      )}
      iconRight={IconCaretDown}
      size='large'
      fullWidth
      ref={anchorRef}
      onClick={() => triggerPopup()}
      disabled={disabled}
      {...triggerProps}
    />
  )

  return (
    <PopupMenu
      id={`token-dropdown-${selectedToken.symbol}`}
      items={menuItems}
      renderTrigger={renderTrigger}
      anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
      css={{
        width: 'auto',
        minWidth: '60px'
      }}
    />
  )
}
