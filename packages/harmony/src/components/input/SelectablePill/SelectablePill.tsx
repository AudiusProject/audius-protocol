import { css } from '@emotion/react'
import styled from '@emotion/styled'

import { Text } from 'components/typography'

import type { SelectablePillProps } from './types'

const StyledPill = styled.button(
  ({ size, isSelected }: SelectablePillProps) => {
    const pillHoverStyles = {
      backgroundColor: 'var(--harmony-s-200)',
      color: 'var(--harmony-static-white)',
      border: '1px solid var(--harmony-secondary)'
    }

    const pillActiveStyles = {
      backgroundColor: 'var(--harmony-s-400)',
      color: 'var(--harmony-static-white)',
      border: '1px solid var(--harmony-s-400)'
    }

    const pillStyles = css({
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 'var(--harmony-spacing-xs)',
      height: 'var(--harmony-unit-6)',
      backgroundColor: 'var(--harmony-white)',
      paddingInline: 'var(--harmony-unit-3)',
      color: 'var(--harmony-text-subdued)',
      cursor: 'pointer',
      userSelect: 'none',
      transition: 'all 0.12s ease-out',
      border: '1px solid var(--harmony-border-strong)',
      borderRadius: 'var(--harmony-border-radius-2xl)',
      ...(isSelected ? pillActiveStyles : {}),

      ':hover': pillHoverStyles,
      ':active': pillActiveStyles
    })

    const largePillActiveStyles = {
      ...pillActiveStyles,
      boxShadow: 'none'
    }

    const largePillStyles = css([
      pillStyles,
      {
        height: 'var(--harmony-unit-8)',
        paddingInline: 'var(--harmony-unit-4)',
        color: 'var(--harmony-text-default)',
        boxShadow: 'var(--harmony-shadow-near)',
        ...(isSelected ? largePillActiveStyles : {}),

        ':hover': {
          ...pillHoverStyles,
          backgroundColor: 'var(--harmony-s-100)',
          border: '1px solid var(--harmony-s-200)',
          boxShadow: 'none'
        },

        ':active': largePillActiveStyles
      }
    ])

    return size === 'large' ? largePillStyles : pillStyles
  }
)

export const SelectablePill = (props: SelectablePillProps) => {
  const { label, icon: Icon } = props

  const StyledIcon = Icon
    ? styled(Icon)({
        marginRight: 'var(--harmony-unit-1)',
        width: 'var(--harmony-unit-4)',
        height: 'var(--harmony-unit-4)',

        '& path': {
          fill: 'currentColor'
        }
      })
    : null

  return (
    <StyledPill {...props}>
      {StyledIcon ? <StyledIcon /> : null}
      <Text variant='body' tag='span'>
        {label}
      </Text>
    </StyledPill>
  )
}
