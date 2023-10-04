import { forwardRef } from 'react'

import cn from 'classnames'

import { useMediaQueryListener } from '../../hooks/useMediaQueryListener'

import baseStyles from './BaseButton.module.css'
import type { BaseButtonProps } from './types'

/**
 * Base component for Harmony buttons. Not intended to be used directly. Use
 * `HarmonyButton` or `HarmonyPlainButton`.
 */
export const BaseButton = forwardRef<HTMLButtonElement, BaseButtonProps>(
  function BaseButton(props, ref) {
    const {
      text,
      iconLeft: LeftIconComponent,
      iconRight: RightIconComponent,
      disabled,
      widthToHideText,
      minWidth,
      className,
      'aria-label': ariaLabelProp,
      fullWidth,
      styles,
      style,
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

    return (
      <button
        aria-label={getAriaLabel()}
        className={cn(
          baseStyles.button,
          styles.button,
          {
            [baseStyles.disabled]: disabled,
            [baseStyles.fullWidth]: fullWidth
          },
          className
        )}
        disabled={disabled}
        ref={ref}
        type='button'
        style={{
          minWidth: minWidth && isTextVisible ? `${minWidth}px` : 'unset',
          ...style
        }}
        {...other}
      >
        {LeftIconComponent ? (
          <LeftIconComponent className={cn(baseStyles.icon, styles.icon)} />
        ) : null}
        {isTextVisible ? (
          <span className={cn(baseStyles.text, styles.text)}>{text}</span>
        ) : null}
        {RightIconComponent ? (
          <RightIconComponent className={cn(baseStyles.icon, styles.icon)} />
        ) : null}
      </button>
    )
  }
)
