import { useInView } from 'react-intersection-observer'

import { useMainContentRef } from 'pages/MainContentContext'

export type DeferredChildProps = {
  visible: boolean
}

// TODO: Configurable
export const useDeferredElement = ({ name }: { name: string }) => {
  const mainContentRef = useMainContentRef()
  const { ref, inView } = useInView({
    root: mainContentRef.current,
    threshold: 0,
    rootMargin: '300px',
    triggerOnce: true,
    fallbackInView: true
  })

  return { ref, inView }
}
