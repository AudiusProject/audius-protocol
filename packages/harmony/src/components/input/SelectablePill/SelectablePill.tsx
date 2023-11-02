import { css, Theme } from '@emotion/react'
import styled from '@emotion/styled'

import { Text } from 'components/text'

import type { SelectablePillProps } from './types'

const StyledPill = styled.button(
  ({ theme, size, isSelected }: SelectablePillProps & { theme: Theme }) => {
    const pillHoverStyles = {
      backgroundColor: theme.color.secondary.s200,
      color: theme.color.static.white,
      border: `1px solid ${theme.color.secondary.secondary}`
    }

    const pillActiveStyles = {
      backgroundColor: theme.color.secondary.s400,
      color: theme.color.static.white,
      border: `1px solid ${theme.color.secondary.s400}`
    }

    const pillStyles = css({
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.xs,
      height: theme.spacing.unit6,
      backgroundColor: theme.color.special.white,
      paddingInline: theme.spacing.unit3,
      color: theme.color.text.subdued,
      cursor: 'pointer',
      userSelect: 'none',
      transition: 'all 0.12s ease-out',
      border: `1px solid ${theme.color.border.strong}`,
      borderRadius: theme.cornerRadius['2xl'],
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
        height: theme.spacing.unit8,
        paddingInline: theme.spacing.unit4,
        color: theme.color.text.default,
        boxShadow: theme.shadows.near,
        ...(isSelected ? largePillActiveStyles : {}),

        ':hover': {
          ...pillHoverStyles,
          backgroundColor: theme.color.secondary.s100,
          border: `1px solid ${theme.color.secondary.s200})`,
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
    ? styled(Icon)(({ theme }) => ({
        marginRight: theme.spacing.unit1,
        width: theme.spacing.unit4,
        height: theme.spacing.unit4,

        '& path': {
          fill: 'currentColor'
        }
      }))
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
