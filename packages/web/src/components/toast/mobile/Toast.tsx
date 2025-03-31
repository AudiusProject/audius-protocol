import { ReactNode } from 'react'

import { Text, Flex, IconComponent } from '@audius/harmony'
import cn from 'classnames'

import ToastLinkContent from './ToastLinkContent'

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
        className={cn({
          [containerClassName!]: !!containerClassName
        })}
      >
        {children}
      </div>
      <Flex
        direction='row'
        gap='s'
        alignItems='center'
        backgroundColor='accent'
        pv='s'
        ph='m'
        borderRadius='m'
      >
        {LeftIcon && <LeftIcon size='s' color='staticWhite' />}
        <Text color='staticWhite' size='s' strength='strong'>
          {content}
        </Text>
        {RightIcon && <RightIcon size='s' color='staticWhite' />}
      </Flex>
    </>
  )
}

export default Toast
