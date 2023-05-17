import { ComponentProps } from 'react'

import cn from 'classnames'

import styles from './GroupHeader.module.css'

type GroupHeaderProps = ComponentProps<'h3'>

export const GroupHeader = (props: GroupHeaderProps) => {
  const { className, ...other } = props
  return <h3 className={cn(styles.root, className)} {...other} />
}
