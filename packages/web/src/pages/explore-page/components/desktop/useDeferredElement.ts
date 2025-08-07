// import { useCallback } from 'react'

import { useInView } from 'react-intersection-observer'

import { useIsMobile } from 'hooks/useIsMobile'
import { useMainContentRef } from 'pages/MainContentContext'

export type DeferredChildProps = {
  visible: boolean
}

// TODO: Configurable
export const useDeferredElement = ({ name }: { name: string }) => {
  const isMobile = useIsMobile()
  const mainContentRef = useMainContentRef()
  //   const onChange = useCallback(
  //     (inView: boolean) => {
  //       if (inView) {
  //         console.log(`${name} is visible`)
  //       }
  //     },
  //     [name]
  //   )
  const { ref, inView } = useInView({
    root: isMobile ? null : mainContentRef.current,
    threshold: 0,
    rootMargin: '300px',
    triggerOnce: true,
    fallbackInView: true
    // onChange
  })

  return { ref, inView }
}
