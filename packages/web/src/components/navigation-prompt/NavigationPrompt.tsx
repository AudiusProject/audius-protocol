import { useEffect, useState, useCallback } from 'react'

import {
  Modal,
  ModalContent,
  ModalHeader,
  Button,
  ModalTitle,
  Text
} from '@audius/harmony'
import cn from 'classnames'
import { Transition } from 'history'
import { Location } from 'react-router-dom'

import { useHistoryContext } from 'app/HistoryProvider'
import layoutStyles from 'components/layout/layout.module.css'

import styles from './NavigationPrompt.module.css'

interface Props {
  when?: boolean | undefined
  shouldBlockNavigation?: (location: Location<unknown>) => boolean
  messages: {
    title: string
    body: string
    cancel: string
    proceed: string
  }
}

function useBlocker(
  blocker: (transition: { retry: () => void; tx: Transition }) => void,
  when: boolean = true
): void {
  const { history } = useHistoryContext()

  useEffect(() => {
    if (!when) return

    const unblock = history.block((tx) => {
      const autoUnblock = () => unblock()
      const retry = () => {
        autoUnblock()
        tx.retry()
      }

      blocker({ retry, tx })
    })

    return unblock
  }, [blocker, history, when])
}

/**
 * Navigation prompt component that blocks navigation and shows a confirmation modal
 */
export const NavigationPrompt = (props: Props) => {
  const { when = true, shouldBlockNavigation, messages } = props
  const [modalVisible, setModalVisible] = useState(false)
  const [pendingRetry, setPendingRetry] = useState<(() => void) | null>(null)

  const handleBlock = useCallback(
    (transition: { retry: () => void; tx: Transition }) => {
      const location = transition.tx.location
      if (!shouldBlockNavigation || shouldBlockNavigation(location)) {
        setModalVisible(true)
        setPendingRetry(() => transition.retry)
      } else {
        transition.retry()
      }
    },
    [shouldBlockNavigation]
  )

  useBlocker(handleBlock, Boolean(when))

  const handleConfirmNavigation = useCallback(() => {
    setModalVisible(false)
    if (pendingRetry) {
      pendingRetry()
      setPendingRetry(null)
    }
  }, [pendingRetry])

  const handleCancelNavigation = useCallback(() => {
    setModalVisible(false)
    setPendingRetry(null)
  }, [])

  if (!when) {
    return null
  }

  return (
    <Modal isOpen={modalVisible} onClose={handleCancelNavigation} size='small'>
      <ModalHeader>
        <ModalTitle title={messages.title} />
      </ModalHeader>
      <ModalContent>
        <div className={cn(layoutStyles.col, layoutStyles.gap6)}>
          <Text variant='body' size='l' textAlign='center'>
            {messages.body}
          </Text>
          <div className={cn(layoutStyles.row, layoutStyles.gap2)}>
            <Button
              className={styles.button}
              variant='secondary'
              onClick={handleCancelNavigation}
            >
              {messages.cancel}
            </Button>
            <Button
              className={styles.button}
              variant='destructive'
              onClick={handleConfirmNavigation}
            >
              {messages.proceed}
            </Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  )
}
