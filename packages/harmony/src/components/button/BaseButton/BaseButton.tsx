import { forwardRef } from 'react'

import { Slot, Slottable } from '@radix-ui/react-slot'
import cn from 'classnames'

import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'

import { useMediaQueryListener } from '../../../hooks/useMediaQueryListener'
import type { BaseButtonProps } from '../types'

import baseStyles from './BaseButton.module.css'

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
      asChild,
      _isHovered,
      _isPressed,
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
      if (isTextHidden && typeof children === 'string') return children
      return undefined
    }

    const ButtonComponent = asChild ? Slot : 'button'

    return (
      <ButtonComponent
        className={cn(
          baseStyles.button,
          styles.button,
          {
            [baseStyles.disabled]: disabled || isLoading,
            [baseStyles.fullWidth]: fullWidth,
            [baseStyles.hover]: _isHovered,
            [baseStyles.active]: _isPressed
          },
          className
        )}
        disabled={disabled || isLoading}
        ref={ref}
        type={asChild ? undefined : 'button'}
        style={{
          minWidth: minWidth && !isTextHidden ? `${minWidth}px` : 'unset',
          ...style
        }}
        aria-label={getAriaLabel()}
        {...other}
      >
        {isLoading ? (
          <LoadingSpinner className={cn(baseStyles.spinner, styles.spinner)} />
        ) : LeftIconComponent ? (
          <LeftIconComponent className={cn(baseStyles.icon, styles.icon)} />
        ) : null}
        {!isTextHidden ? <Slottable>{children}</Slottable> : null}
        {RightIconComponent ? (
          <RightIconComponent className={cn(baseStyles.icon, styles.icon)} />
        ) : null}
      </ButtonComponent>
    )
  }
)
