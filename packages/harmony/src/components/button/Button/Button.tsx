import { CSSProperties, forwardRef } from 'react'

import cn from 'classnames'

import { toCSSVariableName } from '../../../utils/styles'
import { BaseButton } from '../BaseButton/BaseButton'
import { ButtonProps, ButtonSize, ButtonType } from '../types'

import styles from './Button.module.css'

type CSSCustomProperties = CSSProperties & {
  [index: `--${string}`]: any
}

const SIZE_STYLE_MAP: { [k in ButtonSize]: [string, string, string, string] } =
  {
    [ButtonSize.SMALL]: [
      styles.buttonSmall,
      styles.iconSmall,
      styles.textSmall,
      styles.spinnerSmall
    ],
    [ButtonSize.DEFAULT]: [
      styles.buttonDefault,
      styles.iconDefault,
      styles.textDefault,
      styles.spinnerSmall
    ],
    [ButtonSize.LARGE]: [
      styles.buttonLarge,
      styles.iconLarge,
      styles.textLarge,
      styles.spinnerLarge
    ]
  }

const TYPE_STYLE_MAP: { [k in ButtonType]: string } = {
  [ButtonType.PRIMARY]: styles.primary,
  [ButtonType.SECONDARY]: styles.secondary,
  [ButtonType.TERTIARY]: styles.tertiary,
  [ButtonType.DESTRUCTIVE]: styles.destructive
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

    const style: CSSCustomProperties = {
      '--base-color':
        !isDisabled && hexColor
          ? hexColor
          : color
          ? `var(${toCSSVariableName(color)})`
          : undefined
    }

    const [buttonSizeClass, iconSizeClass, textSizeClass, spinnerSizeClass] =
      SIZE_STYLE_MAP[size]

    return (
      <BaseButton
        ref={ref}
        disabled={isDisabled}
        styles={{
          button: cn(
            styles.button,
            TYPE_STYLE_MAP[variant],
            {
              [styles.disabled]: isDisabled,
              [styles.hover]: _isHovered,
              [styles.active]: _isPressed
            },
            buttonSizeClass,
            textSizeClass
          ),
          icon: cn(styles.icon, iconSizeClass),
          spinner: cn(styles.spinner, spinnerSizeClass)
        }}
        style={style}
        {...baseProps}
      />
    )
  }
)
