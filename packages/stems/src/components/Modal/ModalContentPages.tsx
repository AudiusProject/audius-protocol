import { Children, ReactChild, useState } from 'react'

import { animated, Transition } from 'react-spring/renderprops'

import { ModalContent } from './ModalContent'
import styles from './ModalContentPages.module.css'

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
  height,
  children
}: {
  currentPage: number
  width?: number
  height?: number
  children: ReactChild | ReactChild[]
}) => {
  const [lastPage, setLastPage] = useState(0)
  const [transitions, setTransitions] = useState<
    ReturnType<typeof getSwipeTransitions>
  >(getSwipeTransitions('forward'))
  if (lastPage !== currentPage) {
    setTransitions(
      getSwipeTransitions(currentPage > lastPage ? 'forward' : 'back')
    )
    setLastPage(currentPage)
  }
  return (
    <div
      className={styles.transitionContainer}
      style={{
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : '100%'
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
              <ModalContent>{Children.toArray(children)[item]}</ModalContent>
            </animated.div>
          )}
      </Transition>
    </div>
  )
}
