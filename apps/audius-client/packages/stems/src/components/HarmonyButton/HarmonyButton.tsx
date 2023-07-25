import { CSSProperties, forwardRef } from 'react'

import cn from 'classnames'

import { useMediaQueryListener } from 'hooks/useMediaQueryListener'
import { CSSCustomProperties } from 'styles/types'
import { toCSSVariableName } from 'utils/styles'

import styles from './HarmonyButton.module.css'
import {
  HarmonyButtonProps,
  HarmonyButtonType,
  HarmonyButtonSize
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
      text,
      variant = HarmonyButtonType.PRIMARY,
      size = HarmonyButtonSize.DEFAULT,
      iconLeft: LeftIconComponent,
      iconRight: RightIconComponent,
      disabled,
      widthToHideText,
      minWidth,
      className,
      'aria-label': ariaLabelProp,
      fullWidth,
      ...other
    } = props
    const { isMatch: textIsHidden } = useMediaQueryListener(
      `(max-width: ${widthToHideText}px)`
    )

    const isTextVisible = !!text && !textIsHidden

    const getAriaLabel = () => {
      if (ariaLabelProp) return ariaLabelProp
      // Use the text prop as the aria-label if the text becomes hidden
      // and no aria-label was provided to keep the button accessible.
      else if (textIsHidden && typeof text === 'string') return text
      return undefined
    }

    const style: CSSCustomProperties = {
      minWidth: minWidth && isTextVisible ? `${minWidth}px` : 'unset',
      '--button-color':
        !disabled && color ? `var(${toCSSVariableName(color)})` : undefined
    }

    const [buttonSizeClass, iconSizeClass, textSizeClass] = SIZE_STYLE_MAP[size]

    return (
      <button
        aria-label={getAriaLabel()}
        className={cn(
          styles.button,
          buttonSizeClass,
          TYPE_STYLE_MAP[variant],
          {
            [styles.disabled]: disabled,
            [styles.fullWidth]: fullWidth
          },
          className
        )}
        disabled={disabled}
        ref={ref}
        style={style as CSSProperties}
        {...other}
      >
        {LeftIconComponent ? (
          <LeftIconComponent className={cn(styles.icon, iconSizeClass)} />
        ) : null}
        {isTextVisible ? (
          <span className={cn(styles.text, textSizeClass)}>{text}</span>
        ) : null}
        {RightIconComponent ? (
          <RightIconComponent className={cn(styles.icon, iconSizeClass)} />
        ) : null}
      </button>
    )
  }
)
