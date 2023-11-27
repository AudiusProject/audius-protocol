import { PureComponent } from 'react'

import { accountSelectors } from '@audius/common'
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
  fillParent: boolean
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

type ToastState = { showToast: boolean }

class Toast extends PureComponent<ToastProps, ToastState> {
  static defaultProps = {
    delay: 3000,
    containerStyles: {},
    useCaret: false,
    requireAccount: true,
    disabled: false,
    firesOnClick: true,
    fillParent: true,
    mount: MountPlacement.PAGE,
    placement: ComponentPlacement.RIGHT
  }

  state = {
    showToast: false
  }

  hideTimeout: null | any = null

  handleClick = () => {
    const {
      delay,
      firesOnClick,
      disabled,
      requireAccount,
      hasAccount,
      onVisibilityChange
    } = this.props
    if (disabled || !firesOnClick || (!hasAccount && requireAccount)) return

    this.setState({ showToast: true })
    if (onVisibilityChange) onVisibilityChange(true)
    if (this.hideTimeout && !this.hideTimeout.cleared) {
      clearTimeout(this.hideTimeout)
    }
    this.hideTimeout = setTimeout(() => {
      this.setState({ showToast: false })
      if (onVisibilityChange) onVisibilityChange(false)
    }, delay)
  }

  componentDidUpdate = (prevProps: ToastProps) => {
    if (
      prevProps.open === false &&
      this.props.open === true &&
      this.props.delay
    ) {
      this.handleClick()
    }
  }

  componentWillUnmount = () => {
    if (this.hideTimeout && !this.hideTimeout.cleared)
      clearTimeout(this.hideTimeout)
  }

  render() {
    const {
      open,
      text,
      placement,
      children,
      useCaret,
      fillParent,
      mount,
      tooltipClassName,
      overlayClassName,
      containerClassName,
      containerStyles
    } = this.props

    const { showToast } = this.state
    const isVisible = open !== undefined ? open : showToast
    let popupContainer

    switch (mount) {
      case MountPlacement.PARENT:
        popupContainer = (triggerNode: HTMLElement) =>
          triggerNode.parentNode as HTMLElement
        break
      case MountPlacement.PAGE: {
        const page =
          typeof document !== 'undefined' && document.getElementById('page')
        if (page) popupContainer = () => page || undefined
        break
      }
      case MountPlacement.BODY:
      default:
        popupContainer =
          typeof document !== 'undefined'
            ? () => document.body as HTMLElement
            : undefined
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
          onClick={this.handleClick}
          className={containerClassName}
          style={containerStyles}
        >
          {children}
        </div>
        {useCaret ? <div className={cn(styles.caret)} /> : null}
      </Tooltip>
    )
  }
}

function mapStateToProps(state: AppState) {
  return {
    hasAccount: getHasAccount(state)
  }
}

export default connect(mapStateToProps)(Toast)
