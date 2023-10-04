import { forwardRef } from 'react'

import cn from 'classnames'

import type { CSSCustomProperties } from '../../types/styles'
import { toCSSVariableName } from '../../utils/styles'

import { BaseButton } from './BaseButton'
import styles from './HarmonyButton.module.css'
import {
  HarmonyButtonProps,
  HarmonyButtonSize,
  HarmonyButtonType
} from './types'

const SIZE_STYLE_MAP: { [k in HarmonyButtonSize]: [string, string, string] } = {
  [HarmonyButtonSize.SMALL]: [
    styles.buttonSmall,
    styles.iconSmall,
    styles.textSmall
  ],
  [HarmonyButtonSize.DEFAULT]: [
    styles.buttonDefault,
    styles.iconDefault,
    styles.textDefault
  ],
  [HarmonyButtonSize.LARGE]: [
    styles.buttonLarge,
    styles.iconLarge,
    styles.textLarge
  ]
}

const TYPE_STYLE_MAP: { [k in HarmonyButtonType]: string } = {
  [HarmonyButtonType.PRIMARY]: styles.primary,
  [HarmonyButtonType.SECONDARY]: styles.secondary,
  [HarmonyButtonType.TERTIARY]: styles.tertiary,
  [HarmonyButtonType.DESTRUCTIVE]: styles.destructive,
  [HarmonyButtonType.GHOST]: styles.ghost
}

/**
 * A common Button component. Includes a few variants and options to
 * include and position icons.
 */
export const HarmonyButton = forwardRef<HTMLButtonElement, HarmonyButtonProps>(
  function HarmonyButton(props, ref) {
    const {
      color,
      variant = HarmonyButtonType.PRIMARY,
      size = HarmonyButtonSize.DEFAULT,
      disabled,
      ...baseProps
    } = props

    const style: CSSCustomProperties = {
      '--button-color':
        !disabled && color ? `var(${toCSSVariableName(color)})` : undefined
    }

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
        style={style}
        {...baseProps}
      />
    )
  }
)
