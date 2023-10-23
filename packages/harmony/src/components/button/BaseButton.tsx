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
      ...other
    } = props
    const { isMatch: isTextHidden } = useMediaQueryListener(
      `(max-width: ${widthToHideText}px)`
    )

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
