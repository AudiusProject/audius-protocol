import { ReactNode } from 'react'

import { IconCloudUpload, IconComponent } from '@audius/harmony'
import cn from 'classnames'

import styles from './Toast.module.css'
import ToastLinkContent from './ToastLinkContent'

// TODO: SK - Move this into Stems
interface ToastProps {
  children?: JSX.Element
  leftIcon?: IconComponent
  rightIcon?: IconComponent
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
    leftIcon: LeftIcon,
    link,
    linkText,
    rightIcon: RightIcon
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
      <div className={styles.container}>
        <IconCloudUpload size='s' color='inverse' />
        {LeftIcon && <LeftIcon size='s' color='inverse' />}
        {content}
        {RightIcon && <RightIcon size='s' color='inverse' />}
      </div>
    </>
  )
}

export default Toast
