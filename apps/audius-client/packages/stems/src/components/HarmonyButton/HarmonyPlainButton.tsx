import { forwardRef } from 'react'

import cn from 'classnames'

import { BaseButton } from './BaseButton'
import styles from './HarmonyPlainButton.module.css'
import {
  HarmonyPlainButtonProps,
  HarmonyPlainButtonSize,
  HarmonyPlainButtonType
} from './types'

const SIZE_STYLE_MAP: {
  [k in HarmonyPlainButtonSize]: [string, string, string]
} = {
  [HarmonyPlainButtonSize.DEFAULT]: [
    styles.buttonDefault,
    styles.iconDefault,
    styles.textDefault
  ],
  [HarmonyPlainButtonSize.LARGE]: [
    styles.buttonLarge,
    styles.iconLarge,
    styles.textLarge
  ]
}

const TYPE_STYLE_MAP: { [k in HarmonyPlainButtonType]: string } = {
  [HarmonyPlainButtonType.DEFAULT]: styles.default,
  [HarmonyPlainButtonType.SUBDUED]: styles.subdued,
  [HarmonyPlainButtonType.INVERTED]: styles.inverted
}

/**
 * A plain Button component (no border/background). Includes a few variants and options to
 * include and position icons.
 */
export const HarmonyPlainButton = forwardRef<
  HTMLButtonElement,
  HarmonyPlainButtonProps
>(function HarmonyPlainButton(props, ref) {
  const {
    variant = HarmonyPlainButtonType.DEFAULT,
    size = HarmonyPlainButtonSize.DEFAULT,
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
})
