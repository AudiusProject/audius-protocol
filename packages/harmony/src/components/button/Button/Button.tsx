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
        backgroundColor: themeColors.neutral.n150,
        boxShadow: 'none'
      })
    }

    const secondaryHoverStyles: CSSObject = {
      '--overlay-color': '255, 255, 255',
      '--overlay-opacity': 0.2,
      backgroundColor: themeColors.primary.primary,
      color: themeColors.static.white,
      boxShadow: shadows.mid
    }
    const secondaryActiveStyles: CSSObject = {
      ...secondaryHoverStyles,
      '--overlay-color': '0, 0, 0',
      boxShadow: 'none'
    }
    const secondaryStyles: CSSObject = {
      backgroundColor: 'transparent',
      color: themeColors.text.default,
      boxShadow: `0 0 0 1px inset ${themeColors.border.strong}`,

      '&:hover': secondaryHoverStyles,
      '&:active': secondaryActiveStyles,

      ...(_isHovered && secondaryHoverStyles),
      ...(_isPressed && secondaryActiveStyles),
      ...(isDisabled && {
        backgroundColor: themeColors.neutral.n150,
        color: themeColors.static.white,
        boxShadow: 'none'
      })
    }

    const tertiaryHoverStyles: CSSObject = {
      backgroundColor: themeColors.background.white,
      boxShadow: `0 0 0 1px inset ${themeColors.border.strong}, ${shadows.mid}`
    }
    const tertiaryActiveStyles: CSSObject = {
      backgroundColor: themeColors.background.surface2,
      backdropFilter: 'none',
      boxShadow: `0 0 0 1px inset ${themeColors.border.strong}`
    }
    const tertiaryStyles: CSSObject = {
      // Don't use opacity prop as it affects the text too
      backgroundColor:
        type === 'dark' ? 'rgba(50, 51, 77, 0.6)' : 'rgb(255, 255, 255, 0.85)',
      color: themeColors.text.default,
      backdropFilter: 'blur(6px)',
      boxShadow: `0 0 0 1px inset ${themeColors.border.default}, ${shadows.near}`,

      '&:hover': tertiaryHoverStyles,
      '&:active': tertiaryActiveStyles,

      ...(_isHovered && tertiaryHoverStyles),
      ...(_isPressed && tertiaryActiveStyles),
      ...(isDisabled && {
        opacity: 0.45
      })
    }

    const destructiveHoverStyles: CSSObject = {
      '--overlay-color': '255, 255, 255',
      '--overlay-opacity': 0.2,
      backgroundColor: themeColors.special.red,
      color: themeColors.static.white,
      boxShadow: shadows.mid
    }
    const destructiveActiveStyles: CSSObject = {
      ...destructiveHoverStyles,
      '--overlay-color': '0, 0, 0',
      boxShadow: 'none'
    }
    const destructiveStyles: CSSObject = {
      backgroundColor: 'transparent',
      color: themeColors.special.red,
      boxShadow: `0 0 0 1px inset ${themeColors.special.red}`,

      '&:hover': destructiveHoverStyles,
      '&:active': destructiveActiveStyles,

      ...(_isHovered && destructiveHoverStyles),
      ...(_isPressed && destructiveActiveStyles),
      ...(isDisabled && {
        opacity: 0.45
      })
    }

    const buttonCss: CSSObject = {
      '--overlay-color': '0, 0, 0',
      '--overlay-opacity': 0,
      backgroundColor: themeColors.primary.primary,
      color: themeColors.static.white,
      boxSizing: 'border-box',
      border: 'none',
      borderRadius: cornerRadius.s,
      boxShadow: shadows.near,

      '&::before': {
        zIndex: -1,
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(var(--overlay-color), var(--overlay-opacity))'
      },

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
      backgroundColor:
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
