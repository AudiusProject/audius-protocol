import { useEffect, useState } from 'react'

import {
  Modal,
  ModalContent,
  ModalHeader,
  Button,
  ModalTitle,
  Text
} from '@audius/harmony'
import cn from 'classnames'
import { Location, useBlocker } from 'react-router-dom'

import layoutStyles from 'components/layout/layout.module.css'
import { useNavigateToPage } from 'hooks/useNavigateToPage'

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

/**
 * Navigation prompt component that blocks navigation and shows a confirmation modal
 */
export const NavigationPrompt = (props: Props) => {
  const { when = true, shouldBlockNavigation, messages } = props
  const [modalVisible, setModalVisible] = useState(false)
  const [lastLocation, setLastLocation] = useState<Location<unknown> | null>(
    null
  )
  const navigate = useNavigateToPage()

  const blocker = useBlocker(when)

  useEffect(() => {
    if (blocker.state !== 'blocked') return

    const nextLocation = blocker.location as Location<unknown>
    if (!shouldBlockNavigation || shouldBlockNavigation(nextLocation)) {
      setModalVisible(true)
      setLastLocation(nextLocation)
    } else if (blocker.proceed) {
      blocker.proceed()
    }
  }, [blocker, shouldBlockNavigation])

  const handleConfirmNavigationClick = () => {
    setModalVisible(false)
    if (blocker.state === 'blocked' && blocker.proceed) {
      blocker.proceed()
      if (lastLocation) {
        navigate(lastLocation.pathname)
      }
    }
  }

  const closeModal = () => {
    setModalVisible(false)
    if (blocker.state === 'blocked' && blocker.reset) {
      blocker.reset()
    }
  }

  return (
    <Modal isOpen={modalVisible} onClose={closeModal} size='small'>
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
              onClick={closeModal}
            >
              {messages.cancel}
            </Button>
            <Button
              className={styles.button}
              variant='destructive'
              onClick={handleConfirmNavigationClick}
            >
              {messages.proceed}
            </Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  )
}
