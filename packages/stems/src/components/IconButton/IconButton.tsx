import { forwardRef } from 'react'
import * as React from 'react'

import cn from 'classnames'

import styles from './IconButton.module.css'
import { IconButtonProps } from './types'

/** A button that is just an icon, no text. */
export const IconButton = forwardRef<
  HTMLAnchorElement | HTMLButtonElement,
  IconButtonProps
>((props, ref) => {
  const {
    className: classNameProp,
    isActive,
    activeClassName,
    icon,
    ...otherProps
  } = props

  const className = cn(
    styles.container,
    classNameProp,
    { [activeClassName || '']: isActive },
    { [styles.disabled]: otherProps.disabled }
  )

  if ('href' in otherProps) {
    return (
      <a
        className={className}
        ref={ref as React.Ref<HTMLAnchorElement>}
        {...otherProps}
      >
        {icon}
      </a>
    )
  }

  return (
    <button
      className={className}
      ref={ref as React.Ref<HTMLButtonElement>}
      {...otherProps}
    >
      {icon}
    </button>
  )
})
