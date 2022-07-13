import { forwardRef } from 'react'
import * as React from 'react'

import cn from 'classnames'

import styles from './IconButton.module.css'
import { IconButtonProps } from './types'

/** A button that is just an icon, no text. */
export const IconButton = forwardRef(
  (
    {
      onClick,
      className,
      isActive,
      activeClassName,
      icon,
      disabled = false,
      ...props
    }: IconButtonProps,
    ref?: React.Ref<HTMLButtonElement>
  ) => {
    return (
      <button
        className={cn(
          styles.container,
          className,
          { [activeClassName || '']: isActive },
          { [styles.disabled]: disabled }
        )}
        ref={ref}
        disabled={disabled}
        onClick={onClick}
        {...props}>
        {icon}
      </button>
    )
  }
)
