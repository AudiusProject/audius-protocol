import React from 'react'

import cn from 'classnames'

import Toast from 'components/toast/Toast'
import { ComponentPlacement, MountPlacement } from 'components/types'

import styles from './ActionButton.module.css'

type BaseProps = {
  children: JSX.Element
  isDisabled: boolean
  onClick: () => void
}

type ShowToastProps = BaseProps & {
  showToast: true
  toastText: string
  toastDisabled: boolean
  toastRequiresAccount: boolean
  toastDelay: number
  toastContainerClassName?: string
  toastPlacement: ComponentPlacement
  toastMount: MountPlacement
}

type DontShowToastProps = BaseProps & {
  showToast: false
}

// Using a union type (`ActionButtonProps`) and a type guard (`isToastProps`)
// allows us to model optional props (`ShowToastProps`) whose inclusion is conditional on the value
// of another prop (showToast === true)
type ActionButtonProps = ShowToastProps | DontShowToastProps

const isToastProps = (props: ActionButtonProps): props is ShowToastProps =>
  props.showToast

const ActionButton = (props: ShowToastProps | DontShowToastProps) => {
  const onClick = () => {
    if (!props.isDisabled) {
      props.onClick()
    }
  }

  return (
    <div
      className={cn(styles.container, {
        [styles.disabled]: props.isDisabled
      })}
      onClick={onClick}
    >
      {isToastProps(props) ? (
        <Toast
          text={props.toastText}
          disabled={props.toastDisabled}
          requireAccount={props.toastRequiresAccount}
          delay={props.toastDelay}
          containerClassName={props.toastContainerClassName}
          placement={props.toastPlacement}
          mount={props.toastMount}
        >
          {props.children}
        </Toast>
      ) : (
        props.children
      )}
    </div>
  )
}

export default ActionButton
