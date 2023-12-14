import { Children, ReactChild, useState } from 'react'

import { ResizeObserver } from '@juggle/resize-observer'
import cn from 'classnames'
// eslint-disable-next-line no-restricted-imports -- TODO: migrate to @react-spring/web
import { animated, Transition } from 'react-spring/renderprops'
import useMeasure from 'react-use-measure'

import { ModalContent } from './ModalContent'
import styles from './ModalContentPages.module.css'
import { ModalContentProps } from './types'

const INNER_HEIGHT_PADDING = 100

const defaultTransitions = {
  initial: { opacity: 1, transform: 'translate3d(0%, 0, 0)' },
  enter: { opacity: 1, transform: 'translate3d(0%, 0 ,0)' }
}
const getSwipeTransitions = (direction: 'back' | 'forward') =>
  direction === 'forward'
    ? {
        ...defaultTransitions,
        // Next screen enters from right
        from: { opacity: 0, transform: 'translate3d(100%, 0, 0)' },
        // Current screen leaves on left
        leave: { opacity: 0, transform: 'translate3d(-100%, 0, 0)' }
      }
    : {
        ...defaultTransitions,
        // Previous screen enters from left
        from: { opacity: 0, transform: 'translate3d(-100%, 0, 0)' },
        // Current screen leaves on right
        leave: { opacity: 0, transform: 'translate3d(100%, 0, 0)' }
      }

export const ModalContentPages = ({
  currentPage,
  width,
  contentClassName,
  children,
  ...modalContentProps
}: {
  currentPage: number
  width?: number
  contentClassName?: string
  verticalPadding?: number
  children: ReactChild | ReactChild[]
} & ModalContentProps) => {
  const [lastPage, setLastPage] = useState(0)
  const [transitions, setTransitions] = useState<
    ReturnType<typeof getSwipeTransitions>
  >(getSwipeTransitions('forward'))
  const [contentRef, { height }] = useMeasure({
    offsetSize: true,
    polyfill: ResizeObserver
  })

  // A bit of a hack, but instead of resizing the height to the result from
  // useMeasure, clamp it to the window height minus a padding.
  // This makes it so that when inside a "Drawer," safe areas are respected.
  const computedHeight = Math.min(
    height,
    window.innerHeight - INNER_HEIGHT_PADDING
  )

  if (lastPage !== currentPage) {
    setTransitions(
      getSwipeTransitions(currentPage > lastPage ? 'forward' : 'back')
    )
    setLastPage(currentPage)
  }

  const { className: modalContentClassName, ...otherModalContentProps } =
    modalContentProps

  return (
    <div
      className={styles.transitionContainer}
      style={{
        width: width ? `${width}px` : '100%',
        height: computedHeight ? `${computedHeight}px` : '100%'
      }}
    >
      <Transition
        items={currentPage}
        initial={transitions.initial}
        from={transitions.from}
        enter={transitions.enter}
        leave={transitions.leave}
        unique={true}
      >
        {(item) => (style) =>
          (
            <animated.div style={{ ...style }} className={styles.pageContainer}>
              <ModalContent
                className={cn(styles.modalContent, modalContentClassName)}
                {...otherModalContentProps}
              >
                <div
                  className={cn(styles.nestedModalContent, contentClassName)}
                  ref={contentRef}
                >
                  {Children.toArray(children)[item]}
                </div>
              </ModalContent>
            </animated.div>
          )}
      </Transition>
    </div>
  )
}
