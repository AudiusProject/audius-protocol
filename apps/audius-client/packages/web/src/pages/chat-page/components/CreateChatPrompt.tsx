import { useCallback } from 'react'

import { chatSelectors, modalsActions } from '@audius/common'
import { Button, ButtonType, IconCompose } from '@audius/stems'
import { useDispatch } from 'react-redux'

import { useSelector } from 'common/hooks/useSelector'

import styles from './CreateChatPrompt.module.css'

const { getChats } = chatSelectors
const { setVisibility } = modalsActions

const messages = {
  selectTitle: 'Select a Message',
  selectSubtitle: 'Open an existing conversation, or compose a new message!',
  newTitle: 'Start a Conversation!',
  newSubtitle:
    'Connect with other Audius users by starting a private direct message!',
  writeMessage: 'Write a Message'
}

export const CreateChatPrompt = () => {
  const dispatch = useDispatch()
  const chats = useSelector(getChats)
  const hasChats = chats?.length > 0

  const handleClick = useCallback(() => {
    dispatch(setVisibility({ modal: 'CreateChat', visible: true }))
  }, [dispatch])

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.title}>
          {hasChats ? messages.selectTitle : messages.newTitle}
        </div>
        <div className={styles.subtitle}>
          {hasChats ? messages.selectSubtitle : messages.newSubtitle}
        </div>
      </div>
      <Button
        className={styles.button}
        type={ButtonType.PRIMARY_ALT}
        text={messages.writeMessage}
        leftIcon={<IconCompose />}
        onClick={handleClick}
      />
    </div>
  )
}
