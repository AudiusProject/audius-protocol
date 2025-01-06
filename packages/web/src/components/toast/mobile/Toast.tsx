import { ReactNode } from 'react'

import cn from 'classnames'

import styles from './Toast.module.css'
import ToastLinkContent from './ToastLinkContent'

// TODO: SK - Move this into Stems
interface ToastProps {
  children?: JSX.Element
  content: ReactNode
  link?: string
  linkText?: string
  disabled?: boolean
  top?: number
  delay?: number
  containerClassName?: string
  stopClickPropagation?: boolean
  // Whether or not this toast is controlled by the parent or not
  isControlled?: boolean
  isOpen?: boolean
}

const Toast = (props: ToastProps) => {
  const {
    children,
    content: contentProp,
    containerClassName,
    link,
    linkText
  } = props

  const content =
    link && linkText ? (
      <ToastLinkContent
        link={link}
        linkText={linkText}
        text={contentProp as string}
      />
    ) : (
      contentProp
    )

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
