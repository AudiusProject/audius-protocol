import { forwardRef } from 'react'

import cn from 'classnames'

import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'

import { useMediaQueryListener } from '../../hooks/useMediaQueryListener'

import baseStyles from './BaseButton.module.css'
import type { BaseButtonProps } from './types'

/**
 * Base component for Harmony buttons. Not intended to be used directly. Use
 * `Button` or `PlainButton`.
 */
export const BaseButton = forwardRef<HTMLButtonElement, BaseButtonProps>(
  function BaseButton(props, ref) {
    const {
      iconLeft: LeftIconComponent,
      iconRight: RightIconComponent,
      disabled,
      isLoading,
      widthToHideText,
      minWidth,
      className,
      fullWidth,
      styles,
      style,
      children,
      'aria-label': ariaLabelProp,
      ...other
    } = props
    const { isMatch: isTextHidden } = useMediaQueryListener(
      `(max-width: ${widthToHideText}px)`
    )

    const getAriaLabel = () => {
      // always default to manual aria-label prop if provided
      if (ariaLabelProp) return ariaLabelProp
      // We use the children prop as the aria-label if the text becomes hidden
      // and no aria-label was provided to keep the button accessible.
      else if (isTextHidden && typeof children === 'string') return children
      return undefined
    }

    return (
      <button
        className={cn(
          baseStyles.button,
          styles.button,
          {
            [baseStyles.disabled]: disabled || isLoading,
            [baseStyles.fullWidth]: fullWidth
          },
          className
        )}
        disabled={disabled || isLoading}
        ref={ref}
        type='button'
        style={{
          minWidth: minWidth && !isTextHidden ? `${minWidth}px` : 'unset',
          ...style
        }}
        aria-label={getAriaLabel()}
        {...other}
      >
        {isLoading ? (
          <LoadingSpinner className={(baseStyles.spinner, styles.spinner)} />
        ) : LeftIconComponent ? (
          <LeftIconComponent className={cn(baseStyles.icon, styles.icon)} />
        ) : null}
        {!isTextHidden ? children : null}
        {RightIconComponent ? (
          <RightIconComponent className={cn(baseStyles.icon, styles.icon)} />
        ) : null}
      </button>
    )
  }
)
