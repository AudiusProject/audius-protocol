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
import { Location } from 'history'
import { Prompt } from 'react-router-dom'

import layoutStyles from 'components/layout/layout.module.css'
import { useNavigateToPage } from 'hooks/useNavigateToPage'

import styles from './NavigationPrompt.module.css'

interface Props {
  when?: boolean | undefined
  shouldBlockNavigation?: (location: Location) => boolean
  messages: {
    title: string
    body: string
    cancel: string
    proceed: string
  }
}

/**
 * Adapted from https://gist.github.com/michchan/0b142324b2a924a108a689066ad17038#file-routeleavingguard-function-ts-ca839f5faf39-tsx
 */
export const NavigationPrompt = (props: Props) => {
  const { when, shouldBlockNavigation, messages } = props
  const [modalVisible, setModalVisible] = useState(false)
  const [lastLocation, setLastLocation] = useState<Location | null>(null)
  const [confirmedNavigation, setConfirmedNavigation] = useState(false)
  const navigate = useNavigateToPage()

  const closeModal = () => {
    setModalVisible(false)
  }

  // Returning false blocks navigation; true allows it
  const handleBlockedNavigation = (nextLocation: Location): boolean => {
    if (
      !confirmedNavigation &&
      (!shouldBlockNavigation || shouldBlockNavigation(nextLocation))
    ) {
      setModalVisible(true)
      setLastLocation(nextLocation)
      return false
    }
    return true
  }

  const handleConfirmNavigationClick = () => {
    setModalVisible(false)
    setConfirmedNavigation(true)
  }

  useEffect(() => {
    if (confirmedNavigation && lastLocation) {
      // Navigate to the previous blocked location with your navigate function
      navigate(lastLocation.pathname)
    }
  }, [confirmedNavigation, lastLocation, navigate])

  return (
    <>
      <Prompt when={when} message={handleBlockedNavigation} />
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
    </>
  )
}
