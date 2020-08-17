import React, { useEffect, useState, useCallback, ReactNode } from 'react'
import ReactDOM from 'react-dom'

import cn from 'classnames'
import useClickOutside from 'hooks/useClickOutside'
import { animated, useTransition } from 'react-spring'
import styles from './AudiusModal.module.css'
import useScrollLock from 'hooks/useScrollLock'
import { connect } from 'react-redux'
import {
  incrementScrollCount as incrementScrollCountAction,
  decrementScrollCount as decrementScrollCountAction
} from 'store/application/ui/scrollLock/actions'
import { Dispatch } from 'redux'

import { ReactComponent as IconRemove } from 'assets/img/iconRemove.svg'
import useHotkeys from 'hooks/useHotkey'

export enum Anchor {
  CENTER = 'CENTER',
  TOP = 'TOP',
  BOTTOM = 'BOTTOM'
}

const rootId = 'modalRoot'
const bgId = 'bgModal'

type ModalProps = {
  children: ReactNode
  onClose: () => void
  isOpen: boolean

  /**
   * Whether to render a header
   * with a title and dismiss button
   */
  showTitleHeader?: boolean
  title?: React.ReactNode
  subtitle?: string

  /**
   * Whether to dismiss on a click outside the modal
   */
  dismissOnClickOutside?: boolean

  /**
   * Whether to show a dismiss 'X' in the top left
   */
  showDismissButton?: boolean

  // Classnames

  wrapperClassName?: string

  /**
   *  Set max-width on bodyClass to set the modal width
   */
  bodyClassName?: string
  titleClassName?: string
  subtitleClassName?: string
  headerContainerClassName?: string

  anchor?: Anchor
  verticalAnchorOffset?: number

  /**
   * Horizontal padding between modal edges and viewport edge
   */
  horizontalPadding?: number

  /**
   * Horizontal padding between outside of modal and inner content
   */
  contentHorizontalPadding?: number
  allowScroll?: boolean
} & ReturnType<typeof mapDispatchToProps>

const anchorStyleMap = {
  [Anchor.TOP]: styles.top,
  [Anchor.CENTER]: styles.center,
  [Anchor.BOTTOM]: styles.bottom
}

const anchorPropertyMap = {
  [Anchor.TOP]: 'marginTop',
  [Anchor.CENTER]: 'marginTop',
  [Anchor.BOTTOM]: 'marginBottom'
}

const getOffset = (anchor: Anchor, verticalAnchorOffset: number) => {
  return { [anchorPropertyMap[anchor]]: verticalAnchorOffset }
}

const useModalRoot = () => {
  const [modalRoot, setModalRoot] = useState<HTMLElement | null>(null)
  const [modalBg, setModalBg] = useState<HTMLElement | null>(null)

  useEffect(() => {
    let el = document.getElementById(rootId)
    let bgEl = document.getElementById(bgId)

    if (el) {
      setModalRoot(el)
    } else {
      el = document.createElement('div')
      el.id = rootId

      document.body.appendChild(el)
      setModalRoot(el)
    }

    if (bgEl) {
      setModalBg(bgEl)
    } else {
      bgEl = document.createElement('div')
      bgEl.id = bgId
      document.body.appendChild(bgEl)
      setModalBg(bgEl)
    }
  }, [])

  return [modalRoot, modalBg]
}

const Modal = ({
  children,
  onClose,
  isOpen,
  wrapperClassName,
  bodyClassName,
  titleClassName,
  subtitleClassName,
  headerContainerClassName,
  incrementScrollCount,
  decrementScrollCount,
  anchor = Anchor.CENTER,
  subtitle,
  verticalAnchorOffset = 0,
  horizontalPadding = 8,
  contentHorizontalPadding = 0,
  allowScroll = false,
  title = '',
  showTitleHeader = false,
  dismissOnClickOutside = true,
  showDismissButton = false
}: ModalProps) => {
  const onTouchMove = useCallback(
    (e: any) => {
      !allowScroll && e.preventDefault()
    },
    [allowScroll]
  )

  const [modalRoot, bgModal] = useModalRoot()
  const [isDestroyed, setIsDestroyed] = useState(isOpen)

  useScrollLock(isDestroyed, incrementScrollCount, decrementScrollCount)
  useEffect(() => {
    if (isOpen) setIsDestroyed(true)
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      if (bgModal) bgModal.classList.add('bgModalVisible')

      // Need to prevent safari iOS bounce
      // overscroll effect by intercepting
      // touchmove events.
      if (modalRoot) modalRoot.addEventListener('touchmove', onTouchMove)
      return () => {
        if (bgModal) bgModal.classList.remove('bgModalVisible')
      }
    }

    if (bgModal) bgModal.classList.remove('bgModalVisible')
    if (modalRoot) modalRoot.removeEventListener('touchmove', onTouchMove)
  }, [isOpen, bgModal, onTouchMove, modalRoot])

  const transition = useTransition(isOpen, null, {
    from: { transform: 'scale(0)', opacity: 0 },
    enter: { transform: 'scale(1)', opacity: 1 },
    leave: { transform: 'scale(0)', opacity: 0 },
    unique: true,
    config: {
      tension: 310,
      friction: 26,
      clamp: true
    },
    onDestroyed: () => {
      if (!isOpen) setIsDestroyed(false)
    }
  })

  const outsideClickRef = useClickOutside(onClose)
  useHotkeys({ 27 /* escape */: onClose })

  const wrapperClassNames = cn(styles.wrapper, anchorStyleMap[anchor], {
    [wrapperClassName!]: !!wrapperClassName
  })

  const wrapperStyle = {
    paddingLeft: `${horizontalPadding}px`,
    paddingRight: `${horizontalPadding}px`
  }

  const bodyStyle = {
    paddingLeft: `${contentHorizontalPadding}px`,
    paddingRight: `${contentHorizontalPadding}px`
  }

  const bodyClassNames = cn(styles.body, {
    [styles.noScroll!]: !allowScroll,
    [bodyClassName!]: !!bodyClassName
  })

  const headerContainerClassNames = cn(styles.headerContainer, {
    [headerContainerClassName!]: !!headerContainerClassName
  })

  const [height, setHeight] = useState(window.innerHeight)
  useEffect(() => {
    const onResize = () => setHeight(window.innerHeight)
    window.addEventListener('resize', onResize)
    return window.removeEventListener('resize', onResize)
  }, [setHeight])

  const bodyOffset = getOffset(anchor, verticalAnchorOffset)
  return (
    <>
      {modalRoot &&
        ReactDOM.createPortal(
          <>
            {transition.map(
              ({ item, props, key }) =>
                item && (
                  <animated.div
                    className={wrapperClassNames}
                    style={{
                      ...wrapperStyle,
                      opacity: props.opacity,
                      height,
                      minHeight: height
                    }}
                    key={key}
                  >
                    <animated.div
                      ref={dismissOnClickOutside ? outsideClickRef : null}
                      className={bodyClassNames}
                      style={{ ...props, ...bodyOffset, ...bodyStyle }}
                      key={key}
                    >
                      <>
                        {showTitleHeader && (
                          <div className={headerContainerClassNames}>
                            {showDismissButton && (
                              <div
                                className={styles.dismissButton}
                                onClick={onClose}
                              >
                                <IconRemove />
                              </div>
                            )}
                            <div className={cn(styles.header, titleClassName)}>
                              {title}
                            </div>
                            <div
                              className={cn(styles.subtitle, subtitleClassName)}
                            >
                              {subtitle}
                            </div>
                          </div>
                        )}
                        {children}
                      </>
                    </animated.div>
                  </animated.div>
                )
            )}
          </>,
          modalRoot
        )}
    </>
  )
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    incrementScrollCount: () => dispatch(incrementScrollCountAction()),
    decrementScrollCount: () => dispatch(decrementScrollCountAction())
  }
}
export default connect(null, mapDispatchToProps)(Modal)
