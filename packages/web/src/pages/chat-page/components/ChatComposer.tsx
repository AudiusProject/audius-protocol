import {
  ChangeEvent,
  ComponentPropsWithoutRef,
  FormEvent,
  useCallback,
  useState
} from 'react'

import { IconArrow, IconButton } from '@audius/stems'
import cn from 'classnames'

import { TextAreaV2 } from 'components/data-entry/TextAreaV2'
import { audiusSdk } from 'services/audius-sdk'

import styles from './ChatComposer.module.css'

const messages = {
  sendMessage: 'Send Message',
  sendMessagePlaceholder: 'Start a New Message'
}

const ENTER_KEY = 'Enter'

export type ChatComposerProps = ComponentPropsWithoutRef<'div'> & {
  chatId?: string
}

export const ChatComposer = (props: ChatComposerProps) => {
  const { chatId } = props
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
        setValue('')
        const sdk = await audiusSdk()
        await sdk.chats!.message({ chatId, message })
      }
    },
    [chatId, value, setValue]
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
          className={styles.input}
          placeholder={messages.sendMessagePlaceholder}
          onKeyDown={handleKeyDown}
          onChange={handleChange}
          value={value}
          maxVisibleRows={3}
          maxLength={500}
          grows
          resize
        >
          <IconButton
            disabled={!value}
            aria-label={messages.sendMessage}
            type={'submit'}
            icon={<IconArrow className={styles.icon} />}
          />
        </TextAreaV2>
      </form>
    </div>
  )
}
