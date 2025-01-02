import { useCallback, useEffect, useState } from 'react'

import { accountSelectors } from '@audius/common/store'
import Tooltip from 'antd/lib/tooltip'
import cn from 'classnames'
import { connect } from 'react-redux'

import { ComponentPlacement, MountPlacement } from 'components/types'
import { AppState } from 'store/types'

import styles from './Toast.module.css'
const getHasAccount = accountSelectors.getHasAccount

type OwnProps = {
  open?: boolean
  // Time in milliseconds before the toast disappears
  delay?: number
  // Text to appear in toast
  text: string | JSX.Element
  requireAccount?: boolean
  // Called when the toast appears or disappears
  onVisibilityChange?: (isVisible: boolean) => void
  // determines if it should display.
  disabled?: boolean
  // Whether or not the toast is triggered by the child element being clicked.
  firesOnClick?: boolean
  useCaret?: boolean
  // Whether or not the tooltip has 100% width.
  fillParent?: boolean
  // Whether the tooltip gets mounted.
  mount?: MountPlacement
  placement?: ComponentPlacement
  tooltipClassName?: string
  overlayClassName?: string
  containerClassName?: string
  containerStyles?: object
  children?: JSX.Element
}

type ToastProps = OwnProps & ReturnType<typeof mapStateToProps>

const Toast = ({
  open,
  delay = 3000,
  text,
  requireAccount = true,
  onVisibilityChange,
  disabled = false,
  firesOnClick = true,
  useCaret = false,
  fillParent = true,
  mount = MountPlacement.PAGE,
  placement = ComponentPlacement.RIGHT,
  tooltipClassName,
  overlayClassName,
  containerClassName,
  containerStyles = {},
  children,
  hasAccount
}: ToastProps) => {
  const [showToast, setShowToast] = useState(false)
  const [hideTimeout, setHideTimeout] = useState<ReturnType<
    typeof setTimeout
  > | null>(null)

  const handleClick = useCallback(() => {
    if (disabled || !firesOnClick || (!hasAccount && requireAccount)) return

    setShowToast(true)
    if (onVisibilityChange) onVisibilityChange(true)
    if (hideTimeout) {
      clearTimeout(hideTimeout)
    }
    const timeout = setTimeout(() => {
      setShowToast(false)
      if (onVisibilityChange) onVisibilityChange(false)
    }, delay)
    setHideTimeout(timeout)
  }, [
    disabled,
    firesOnClick,
    hasAccount,
    requireAccount,
    onVisibilityChange,
    delay,
    hideTimeout
  ])

  useEffect(() => {
    if (open && delay) {
      handleClick()
    }
  }, [open, delay, handleClick])

  useEffect(() => {
    return () => {
      if (hideTimeout) clearTimeout(hideTimeout)
    }
  }, [hideTimeout])

  const isVisible = open !== undefined ? open : showToast
  let popupContainer: ((triggerNode: HTMLElement) => HTMLElement) | undefined

  switch (mount) {
    case MountPlacement.PARENT:
      popupContainer = (triggerNode: HTMLElement) =>
        triggerNode.parentNode as HTMLElement
      break
    case MountPlacement.PAGE: {
      const page =
        typeof document !== 'undefined' && document.getElementById('page')
      if (page) popupContainer = () => page
      break
    }
    case MountPlacement.BODY:
    default:
      popupContainer =
        typeof document !== 'undefined' ? () => document.body : undefined
  }

  return (
    <Tooltip
      className={cn(styles.tooltip, {
        [tooltipClassName as string]: !!tooltipClassName,
        [styles.fillParent]: fillParent
      })}
      placement={placement}
      title={text}
      visible={isVisible}
      getPopupContainer={popupContainer}
      overlayClassName={cn(styles.toast, {
        [overlayClassName as string]: !!overlayClassName && isVisible,
        [styles.hideCaret]: !useCaret
      })}
    >
      <div
        onClick={handleClick}
        className={containerClassName}
        style={containerStyles}
      >
        {children}
      </div>
      {useCaret ? <div className={cn(styles.caret)} /> : null}
    </Tooltip>
  )
}

function mapStateToProps(state: AppState) {
  return {
    hasAccount: getHasAccount(state)
  }
}

export default connect(mapStateToProps)(Toast)
