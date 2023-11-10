import { CSSObject, useTheme } from '@emotion/react'
import styled from '@emotion/styled'

import { Text } from 'components/text'

import type { SelectablePillProps } from './types'

const SelectablePillRoot = styled.button<SelectablePillProps>((props) => {
  const { theme, isSelected, size, _isHovered } = props

  const hoverCss: CSSObject = {
    backgroundColor: theme.color.secondary.s200,
    color: theme.color.static.white,
    border: `1px solid ${theme.color.secondary.secondary}`,
    ...(size === 'large' && {
      backgroundColor: theme.color.secondary.s100,
      border: `1px solid ${theme.color.secondary.s200})`,
      boxShadow: 'none'
    })
  }

  const activeCss: CSSObject = {
    backgroundColor: theme.color.secondary.s400,
    color: theme.color.static.white,
    border: `1px solid ${theme.color.secondary.s400}`,

    ...(size === 'large' && {
      boxShadow: 'none'
    })
  }

  return {
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

    ...(size === 'large' && {
      height: theme.spacing.unit8,
      paddingInline: theme.spacing.unit4,
      color: theme.color.text.default,
      boxShadow: theme.shadows.near
    }),

    ...(_isHovered && hoverCss),
    ...(isSelected && activeCss),

    ':hover': hoverCss,
    ':active': activeCss
  }
})

export const SelectablePill = (props: SelectablePillProps) => {
  const { label, icon: Icon } = props
  const { spacing } = useTheme()

  const iconCss = {
    marginRight: spacing.unit1,
    width: spacing.unit4,
    height: spacing.unit4,

    '& path': {
      fill: 'currentColor'
    }
  }

  return (
    <SelectablePillRoot {...props}>
      {Icon ? <Icon css={iconCss} /> : null}
      <Text variant='body' tag='span'>
        {label}
      </Text>
    </SelectablePillRoot>
  )
}
