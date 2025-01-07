import { forwardRef } from 'react'

import { CSSObject, useTheme } from '@emotion/react'

import { BaseButton } from '../BaseButton/BaseButton'

import { PlainButtonProps } from './types'

/**
 * A plain Button component (no border/background). Includes a few variants and options to
 * include and position icons.
 */
export const PlainButton = forwardRef<HTMLButtonElement, PlainButtonProps>(
  function PlainButton(props, ref) {
    const {
      variant = 'default',
      size = 'default',
      disabled,
      children,
      ...baseProps
    } = props
    const isDisabled = disabled || baseProps.isLoading
    const { color, spacing, typography } = useTheme()

    // Size Styles
    const defaultStyles: CSSObject = {
      gap: spacing.xs,
      height: spacing.unit4,
      fontSize: typography.size.s,
      lineHeight: typography.lineHeight.s
    }
    const defaultIconStyles: CSSObject = {
      width: spacing.unit4,
      height: spacing.unit4
    }

    const largeStyles: CSSObject = {
      gap: spacing.s,
      height: spacing.unit5,
      fontSize: typography.size.l,
      lineHeight: typography.lineHeight.m
    }
    const largeIconStyles: CSSObject = {
      width: spacing.unit5,
      height: spacing.unit5
    }

    const buttonCss: CSSObject = {
      '--text-color':
        variant === 'subdued' && !isDisabled
          ? color.text.subdued
          : variant === 'inverted'
            ? color.static.staticWhite
            : color.text.default,
      background: 'transparent',
      border: 'none',
      color: 'var(--text-color)',
      '& svg': {
        fill: 'var(--text-color)'
      },
      fontWeight: typography.weight.bold,

      ...(size === 'large' ? largeStyles : defaultStyles),

      '&:hover': {
        '--text-color':
          variant === 'inverted'
            ? color.static.staticWhite
            : color.secondary.secondary,
        ...(variant === 'inverted' && { opacity: 0.8 })
      },

      '&:active': {
        '--text-color':
          variant === 'inverted'
            ? color.static.staticWhite
            : color.secondary.s500,
        ...(variant === 'inverted' && { opacity: 0.5 })
      },

      ...(isDisabled && {
        opacity: 0.2
      })
    }

    const iconCss = size === 'large' ? largeIconStyles : defaultIconStyles

    return (
      <BaseButton
        ref={ref}
        disabled={isDisabled}
        styles={{
          button: buttonCss,
          icon: iconCss
        }}
        {...baseProps}
      >
        <span css={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {children}
        </span>
      </BaseButton>
    )
  }
)
