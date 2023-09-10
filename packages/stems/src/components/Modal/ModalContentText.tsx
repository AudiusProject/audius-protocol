import { ComponentProps } from 'react'

import cn from 'classnames'

import styles from './ModalContentText.module.css'

type ModalContentTextProps = ComponentProps<'p'>

export const ModalContentText = (props: ModalContentTextProps) => {
  const { className, ...other } = props
  return <p className={cn(styles.root, className)} {...other} />
}
