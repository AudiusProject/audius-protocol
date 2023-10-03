import { forwardRef } from 'react'

import cn from 'classnames'

import { Text } from 'components/typography'

import styles from './SelectablePill.module.css'
import type { SelectablePillProps } from './types'

export const SelectablePill = forwardRef<
  HTMLButtonElement,
  SelectablePillProps
>(
  (
    {
      size = 'default',
      isSelected,
      label,
      icon: IconComponent,
      className,
      ...restProps
    },
    ref
  ) => {
    return (
      <button
        className={cn(
          styles.pill,
          {
            [styles.large!]: size === 'large',
            [styles.selected!]: isSelected
          },
          className
        )}
        type='button'
        ref={ref}
        {...restProps}
      >
        {IconComponent ? <IconComponent className={styles.icon} /> : null}
        <Text variant='body' tag='span'>
          {label}
        </Text>
      </button>
    )
  }
)
