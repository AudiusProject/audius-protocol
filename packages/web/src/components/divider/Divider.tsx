import { Divider as AntDivider } from 'antd'
import type { DividerProps as AntDividerProps } from 'antd'
import cn from 'classnames'

import styles from './Divider.module.css'

type DividerProps = AntDividerProps

export const Divider = (props: DividerProps) => {
  const { className, ...other } = props
  const { type = 'horizontal' } = other

  return (
    <AntDivider
      className={cn(
        styles.root,
        {
          [styles.horizontal]: type === 'horizontal'
        },
        className
      )}
      {...props}
    />
  )
}
