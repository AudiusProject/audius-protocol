import {
  ChangeEvent,
  ComponentPropsWithoutRef,
  FormEvent,
  useCallback,
  useState,
  useRef,
  useEffect
} from 'react'

import { chatActions } from '@audius/common/store'
import { IconSend } from '@audius/harmony'
import { IconButton } from '@audius/stems'
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
  presetMessage?: string
  onMessageSent: () => void
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
  const { chatId, presetMessage, onMessageSent } = props
  const dispatch = useDispatch()
  const [value, setValue] = useState(presetMessage ?? '')
  const ref = useRef<HTMLTextAreaElement>(null)
  const chatIdRef = useRef(chatId)

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
        onMessageSent()
      }
    },
    [chatId, value, setValue, dispatch, onMessageSent]
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

  // Set focus and clear on new chat selected
  useEffect(() => {
    if (chatId) {
      ref.current?.focus()
    }
    if (chatId !== chatIdRef.current) {
      setValue('')
      chatIdRef.current = chatId
    }
  }, [ref, chatId, chatIdRef])

  return (
    <div className={cn(styles.root, props.className)}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <TextAreaV2
          ref={ref}
          rows={1}
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
