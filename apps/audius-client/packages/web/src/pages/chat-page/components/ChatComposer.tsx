import {
  ChangeEvent,
  ComponentPropsWithoutRef,
  FormEvent,
  useCallback,
  useState
} from 'react'

import { chatActions } from '@audius/common'
import { IconButton, IconSend } from '@audius/stems'
import cn from 'classnames'
import { useDispatch } from 'react-redux'

import { TextAreaV2 } from 'components/data-entry/TextAreaV2'

import styles from './ChatComposer.module.css'

const { sendMessage } = chatActions

const messages = {
  sendMessage: 'Send Message',
  sendMessagePlaceholder: 'Start a New Message'
}

const ENTER_KEY = 'Enter'

export type ChatComposerProps = ComponentPropsWithoutRef<'div'> & {
  chatId?: string
}

const MAX_MESSAGE_LENGTH = 10000

type ChatSendButtonProps = { disabled: boolean }

export const ChatSendButton = ({ disabled }: ChatSendButtonProps) => {
  return (
    <IconButton
      className={styles.sendButton}
      disabled={disabled}
      aria-label={messages.sendMessage}
      type={'submit'}
      icon={<IconSend className={styles.icon} />}
    />
  )
}

export const ChatComposer = (props: ChatComposerProps) => {
  const { chatId } = props
  const dispatch = useDispatch()
  const [value, setValue] = useState('')

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      setValue(e.target.value)
    },
    [setValue]
  )

  const handleSubmit = useCallback(
    async (e?: FormEvent) => {
      e?.preventDefault()
      if (chatId && value) {
        const message = value
        dispatch(sendMessage({ chatId, message }))
        setValue('')
      }
    },
    [chatId, value, setValue, dispatch]
  )

  // Submit when pressing enter while not holding shift
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === ENTER_KEY && !e.shiftKey) {
        e.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit]
  )

  return (
    <div className={cn(styles.root, props.className)}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <TextAreaV2
          rows={1}
          className={styles.input}
          placeholder={messages.sendMessagePlaceholder}
          onKeyDown={handleKeyDown}
          onChange={handleChange}
          value={value}
          maxVisibleRows={10}
          maxLength={MAX_MESSAGE_LENGTH}
          showMaxLength={!!value && value.length > MAX_MESSAGE_LENGTH * 0.85}
          grows
          resize
        >
          <ChatSendButton disabled={!value} />
        </TextAreaV2>
      </form>
    </div>
  )
}
