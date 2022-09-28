import { useCallback, useEffect, useRef } from 'react'

import cn from 'classnames'

import { useModalState } from 'common/hooks/useModalState'

import styles from './StripeOnRampModal.module.css'

export const StripeOnRampModal = () => {
  const [isOpen, setIsOpen] = useModalState('StripeOnRamp')

  const el = useRef<HTMLDivElement>(null)

  const handleBackgroundClicked = useCallback(
    (e) => {
      setIsOpen(false)
      e.stopPropagation()
    },
    [setIsOpen]
  )

  useEffect(() => {
    const mountedFrame = el.current?.querySelector('iframe')
    if (!isOpen && mountedFrame) {
      el.current?.removeChild(mountedFrame)
    }
  }, [isOpen])

  return (
    <div
      className={cn(styles.stripeModalWrapper, { [styles.visible]: isOpen })}
      onClick={handleBackgroundClicked}
    >
      <div
        id='stripe-onramp-modal'
        ref={el}
        className={styles.stripeModal}
      ></div>
    </div>
  )
}
