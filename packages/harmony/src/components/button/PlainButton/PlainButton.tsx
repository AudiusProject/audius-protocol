import { forwardRef } from 'react'

import cn from 'classnames'

import { BaseButton } from '../BaseButton/BaseButton'
import { PlainButtonProps, PlainButtonSize, PlainButtonType } from '../types'

import styles from './PlainButton.module.css'

const SIZE_STYLE_MAP: {
  [k in PlainButtonSize]: [string, string, string, string]
} = {
  [PlainButtonSize.DEFAULT]: [
    styles.buttonDefault,
    styles.iconDefault,
    styles.textDefault,
    styles.spinnerDefault
  ],
  [PlainButtonSize.LARGE]: [
    styles.buttonLarge,
    styles.iconLarge,
    styles.textLarge,
    styles.spinnerLarge
  ]
}

const TYPE_STYLE_MAP: { [k in PlainButtonType]: string } = {
  [PlainButtonType.DEFAULT]: styles.default,
  [PlainButtonType.SUBDUED]: styles.subdued,
  [PlainButtonType.INVERTED]: styles.inverted
}

/**
 * A plain Button component (no border/background). Includes a few variants and options to
 * include and position icons.
 */
export const PlainButton = forwardRef<HTMLButtonElement, PlainButtonProps>(
  function PlainButton(props, ref) {
    const {
      variant = PlainButtonType.DEFAULT,
      size = PlainButtonSize.DEFAULT,
      disabled,
      ...baseProps
    } = props
    const isDisabled = disabled || baseProps.isLoading

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
            { [styles.disabled]: isDisabled },
            buttonSizeClass,
            textSizeClass
          ),
          icon: cn(styles.icon, iconSizeClass),
          spinner: cn(styles.spinner, spinnerSizeClass)
        }}
        {...baseProps}
      />
    )
  }
)
