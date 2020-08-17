import React, { ReactNode } from 'react'
import cn from 'classnames'

import styles from './Toast.module.css'

interface ToastProps {
  children?: JSX.Element
  text: ReactNode
  disabled?: boolean
  top?: number
  delay?: number
  containerClassName?: string
  stopClickPropagation?: boolean
  // Whether or not this toast is controlled by the parent or not
  isControlled?: boolean
  isOpen?: boolean
}

export const Toast = ({ children, text, containerClassName }: ToastProps) => {
  return (
    <>
      <div
        className={cn(styles.wrapperClass, {
          [containerClassName!]: !!containerClassName
        })}
      >
        {children}
      </div>
      <div className={styles.container}>{text}</div>
    </>
  )
}

export default Toast
