import { Divider as AntDivider } from 'antd'
import type { DividerProps as AntDividerProps } from 'antd'
import cn from 'classnames'

import styles from './Divider.module.css'

type DividerProps = AntDividerProps & {
  variant?: 'default' | 'subdued'
}

export const Divider = (props: DividerProps) => {
  const { className, variant = 'subdued', ...other } = props

  const { type = 'horizontal' } = other

  return (
    <AntDivider
      className={cn(
        styles[variant],
        {
          [styles.horizontal]: type === 'horizontal'
        },
        className
      )}
      {...other}
    />
  )
}
