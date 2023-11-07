import { CSSProperties, forwardRef } from 'react'

import { CSSObject, useTheme } from '@emotion/react'

import { toCSSVariableName } from '../../../utils/styles'
import { BaseButton } from '../BaseButton/BaseButton'
import { ButtonProps, ButtonSize, ButtonType } from '../types'

type CSSCustomProperties = CSSProperties & {
  [index: `--${string}`]: any
}

/**
 * Buttons allow users to trigger an action or event with a single click.
 * For example, you can use a button for allowing the functionality of
 * submitting a form, opening a dialog, canceling an action, or performing
 * a delete operation.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(props, ref) {
    const {
      color,
      hexColor,
      variant = ButtonType.PRIMARY,
      size = ButtonSize.DEFAULT,
      disabled,
      ...baseProps
    } = props
    const { _isHovered, _isPressed, isLoading } = baseProps
    const isDisabled = disabled || isLoading
    const {
      type,
      color: themeColors,
      cornerRadius,
      shadows,
      spacing,
      typography
    } = useTheme()

    // Size Styles
    const smallStyles: CSSObject = {
      gap: spacing.unit1,
      height: spacing.unit8,
      paddingInline: spacing.unit3,
      fontSize: typography.size.s,
      fontWeight: typography.weight.bold,
      lineHeight: spacing.unit4,
      textTransform: 'capitalize'
    }
    const smallIconStyles: CSSObject = {
      zIndex: 1,
      width: spacing.unit4,
      height: spacing.unit4
    }

    const defaultStyles: CSSObject = {
      gap: spacing.unit2,
      height: spacing.unit12,
      paddingInline: spacing.unit6,
      fontSize: typography.size.l,
      fontWeight: typography.weight.bold,
      // TODO: See if this can be done with theme vars
      lineHeight: 'calc(4.5 * var(--harmony-unit))',
      textTransform: 'capitalize'
    }
    const defaultIconStyles: CSSObject = {
      zIndex: 1,
      width: spacing.unit5,
      height: spacing.unit5
    }

    const largeStyles: CSSObject = {
      gap: spacing.unit2,
      height: spacing.unit16,
      paddingInline: spacing.unit6,
      fontSize: typography.size.xl,
      fontWeight: typography.weight.bold,
      lineHeight: spacing.unit4,
      letterSpacing: '0.25px',
      textTransform: 'uppercase'
    }
    const largeIconStyles: CSSObject = {
      zIndex: 1,
      width: spacing.unit6,
      height: spacing.unit6
    }

    // Variant Styles
    const primaryHoverStyles: CSSObject = {
      '--overlay-color': '255, 255, 255',
      '--overlay-opacity': 0.2,
      boxShadow: shadows.mid
    }
    const primaryActiveStyles: CSSObject = {
      '--overlay-color': '0, 0, 0',
      '--overlay-opacity': 0.2,
      boxShadow: 'none'
    }
    const primaryStyles: CSSObject = {
      '&:hover': primaryHoverStyles,
      '&:active': primaryActiveStyles,

      ...(_isHovered && primaryHoverStyles),
      ...(_isPressed && primaryActiveStyles),
      ...(isDisabled && {
        '--base-color': themeColors.neutral.n150,
        '--text-color': themeColors.special.white,
        backgroundColor: themeColors.neutral.n150,
        borderColor: themeColors.neutral.n150,
        boxShadow: 'none'
      })
    }

    const secondaryHoverStyles: CSSObject = {
      '--base-color': themeColors.primary.primary,
      '--text-color': themeColors.static.white,
      background: 'var(--bg-color)',
      '--overlay-color': '255, 255, 255',
      '--overlay-opacity': 0.2,
      border: '1px solid transparent',
      boxShadow: shadows.mid
    }
    const secondaryActiveStyles: CSSObject = {
      ...secondaryHoverStyles,
      '--overlay-color': '0, 0, 0',
      boxShadow: 'none'
    }
    const secondaryStyles: CSSObject = {
      '--base-color': themeColors.border.strong,
      '--text-color': themeColors.text.default,
      background: 'transparent',
      boxShadow: 'none',
      border: `1px solid ${themeColors.border.strong}`,

      '&:hover': secondaryHoverStyles,
      '&:active': secondaryActiveStyles,

      ...(_isHovered && secondaryHoverStyles),
      ...(_isPressed && secondaryActiveStyles),
      ...(isDisabled && {
        opacity: 0.45
      })
    }

    const tertiaryHoverStyles: CSSObject = {
      '--base-color': themeColors.border.strong,
      boxShadow: shadows.mid,
      backgroundColor: themeColors.background.white,
      backdropFilter: 'none',
      border: `1px solid ${themeColors.border.strong}`
    }
    const tertiaryActiveStyles: CSSObject = {
      ...tertiaryHoverStyles,
      boxShadow: 'none',
      backgroundColor: themeColors.background.surface2
    }
    const tertiaryStyles: CSSObject = {
      '--base-color': themeColors.border.default,
      '--text-color': themeColors.text.default,
      // Don't use opacity prop as it affects the text too
      backgroundColor:
        type === 'dark' ? 'rgba(50, 51, 77, 0.6)' : 'rgb(255, 255, 255, 0.85)',
      backdropFilter: 'blur(6px)',
      border: `1px solid ${themeColors.border.default}`,

      '&:hover': tertiaryHoverStyles,
      '&:active': tertiaryActiveStyles,

      ...(_isHovered && tertiaryHoverStyles),
      ...(_isPressed && tertiaryActiveStyles),
      ...(isDisabled && {
        boxShadow: 'none',
        opacity: 0.45
      })
    }

    const destructiveHoverStyles: CSSObject = {
      '--text-color': themeColors.static.white,
      background: 'var(--bg-color)',
      boxShadow: shadows.mid,
      border: '1px solid transparent'
    }
    const destructiveActiveStyles: CSSObject = {
      ...destructiveHoverStyles,
      '--overlay-color': '0, 0, 0',
      '--overlay-opacity': 0.2,
      boxShadow: 'none'
    }
    const destructiveStyles: CSSObject = {
      '--base-color': themeColors.special.red,
      '--text-color': themeColors.special.red,
      background: 'transparent',
      boxShadow: 'none',
      border: `1px solid ${themeColors.special.red}`,

      '&:hover': destructiveHoverStyles,
      '&:active': destructiveActiveStyles,

      ...(_isHovered && destructiveHoverStyles),
      ...(_isPressed && destructiveActiveStyles),
      ...(isDisabled && {
        opacity: 0.45
      })
    }

    const buttonCss: CSSObject = {
      '--base-color': themeColors.primary.primary,
      '--text-color': themeColors.static.white,
      '--overlay-color': '0, 0, 0',
      '--overlay-opacity': 0,
      '--bg-color': `linear-gradient(
          0deg,
          rgba(var(--overlay-color), var(--overlay-opacity)) 0%,
          rgba(var(--overlay-color), var(--overlay-opacity)) 100%
        ),
        var(--base-color)`,

      boxSizing: 'border-box',
      color: 'var(--text-color)',
      border: '0px solid transparent',
      borderRadius: cornerRadius.s,
      background: 'var(--bg-color)',
      boxShadow: shadows.near,

      ...(size === ButtonSize.SMALL
        ? smallStyles
        : size === ButtonSize.LARGE
        ? largeStyles
        : defaultStyles),

      ...(variant === ButtonType.SECONDARY
        ? secondaryStyles
        : variant === ButtonType.TERTIARY
        ? tertiaryStyles
        : variant === ButtonType.DESTRUCTIVE
        ? destructiveStyles
        : primaryStyles)
    }

    const iconCss =
      size === ButtonSize.SMALL
        ? smallIconStyles
        : size === ButtonSize.LARGE
        ? largeIconStyles
        : defaultIconStyles

    const style: CSSCustomProperties = {
      '--base-color':
        !isDisabled && hexColor
          ? hexColor
          : color
          ? `var(${toCSSVariableName(color)})`
          : undefined
    }

    return (
      <BaseButton
        ref={ref}
        disabled={isDisabled}
        styles={{
          button: buttonCss,
          icon: iconCss
        }}
        style={style}
        {...baseProps}
      />
    )
  }
)
