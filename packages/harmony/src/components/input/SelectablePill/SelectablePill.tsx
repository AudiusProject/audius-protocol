import { CSSObject, useTheme } from '@emotion/react'

import { HiddenInput } from 'components/common/HiddenInput'
import { Text } from 'components/text'

import type { SelectablePillProps } from './types'

export const SelectablePill = (props: SelectablePillProps) => {
  const {
    isSelected,
    size = 'small',
    _isHovered,
    label,
    icon: Icon,
    ...other
  } = props

  const { disabled, type } = other

  const theme = useTheme()
  const { spacing } = theme

  const hoverCss: CSSObject = {
    backgroundColor: theme.color.secondary.s200,
    color: theme.color.static.white,
    border: `1px solid ${theme.color.secondary.secondary}`,
    ...(size === 'large' && {
      backgroundColor: theme.color.secondary.s100,
      border: `1px solid ${theme.color.secondary.s200}`,
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

  const rootCss: CSSObject = {
    display: 'inline-flex',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    color: theme.color.text.default,
    backgroundColor: theme.color.background.white,
    cursor: 'pointer',
    userSelect: 'none',
    transition: 'all 0.12s ease-out',
    textWrap: 'nowrap',
    border: `1px solid ${theme.color.border.strong}`,
    borderRadius: theme.cornerRadius['2xl'],
    ...(size === 'small' && {
      height: theme.spacing.xl,
      paddingInline: theme.spacing.m
    }),
    ...(size === 'large' && {
      height: theme.spacing['2xl'],
      paddingInline: theme.spacing.l,
      boxShadow: theme.shadows.near
    }),
    ...(disabled && { opacity: 0.45 }),
    ...(_isHovered && hoverCss),
    ...(isSelected && activeCss),
    ...((disabled || _isHovered) && {
      pointerEvents: 'none'
    }),
    ':hover': hoverCss,
    ':active': activeCss
  }

  const iconCss = {
    marginRight: spacing.xs,
    width: spacing.l,
    height: spacing.l,

    '& path': {
      fill: 'currentColor'
    }
  }

  const pillContent = (
    <>
      {Icon ? <Icon css={iconCss} /> : null}
      <Text variant='body' tag='span'>
        {label}
      </Text>
    </>
  )

  switch (type) {
    case 'checkbox':
    case 'radio': {
      const { checked, ...rest } = other

      return (
        <label css={rootCss}>
          {pillContent}
          <HiddenInput {...rest} checked={checked ?? isSelected} />
        </label>
      )
    }
    case 'button':
    case 'reset':
    case 'submit':
    default: {
      return (
        <button css={rootCss} {...other}>
          {pillContent}
        </button>
      )
    }
  }
}
