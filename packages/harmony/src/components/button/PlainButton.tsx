import { forwardRef } from 'react'

import cn from 'classnames'

import { BaseButton } from './BaseButton'
import styles from './PlainButton.module.css'
import { PlainButtonProps, PlainButtonSize, PlainButtonType } from './types'

const SIZE_STYLE_MAP: {
  [k in PlainButtonSize]: [string, string, string]
} = {
  [PlainButtonSize.DEFAULT]: [
    styles.buttonDefault,
    styles.iconDefault,
    styles.textDefault
  ],
  [PlainButtonSize.LARGE]: [
    styles.buttonLarge,
    styles.iconLarge,
    styles.textLarge
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

    const [buttonSizeClass, iconSizeClass, textSizeClass] = SIZE_STYLE_MAP[size]

    return (
      <BaseButton
        ref={ref}
        disabled={disabled}
        styles={{
          button: cn(
            styles.button,
            TYPE_STYLE_MAP[variant],
            { [styles.disabled]: disabled },
            buttonSizeClass
          ),
          icon: cn(styles.icon, iconSizeClass),
          text: cn(styles.text, textSizeClass)
        }}
        {...baseProps}
      />
    )
  }
)
