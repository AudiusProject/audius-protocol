import { ReactNode } from 'react'

import cn from 'classnames'

import styles from './Toast.module.css'

// TODO: SK - Move this into Stems
interface ToastProps {
  children?: JSX.Element
  content: ReactNode
  disabled?: boolean
  top?: number
  delay?: number
  containerClassName?: string
  stopClickPropagation?: boolean
  // Whether or not this toast is controlled by the parent or not
  isControlled?: boolean
  isOpen?: boolean
}

export const Toast = ({
  children,
  content,
  containerClassName
}: ToastProps) => {
  return (
    <>
      <div
        className={cn(styles.wrapperClass, {
          [containerClassName!]: !!containerClassName
        })}
      >
        {children}
      </div>
      <div className={styles.container}>{content}</div>
    </>
  )
}

export default Toast
