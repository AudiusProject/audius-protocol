import { MouseEvent, useCallback, useEffect, useRef } from 'react'

import { buyAudioActions, buyAudioSelectors } from '@audius/common'
import cn from 'classnames'
import { useDispatch, useSelector } from 'react-redux'

import { useModalState } from 'common/hooks/useModalState'

import styles from './StripeOnRampModal.module.css'

const { onRampCanceled } = buyAudioActions
const { getStripeSessionStatus } = buyAudioSelectors

export const StripeOnRampModal = () => {
  const [isOpen, setIsOpen] = useModalState('StripeOnRamp')
  const sessionStatus = useSelector(getStripeSessionStatus)
  const dispatch = useDispatch()

  const el = useRef<HTMLDivElement>(null)

  const handleBackgroundClicked = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (sessionStatus !== 'fulfillment_processing') {
        setIsOpen(false)
        e.stopPropagation()
        if (sessionStatus !== 'fulfillment_complete') {
          dispatch(onRampCanceled())
        }
      }
    },
    [setIsOpen, dispatch, sessionStatus]
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
