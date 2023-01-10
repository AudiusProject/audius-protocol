import {
  ChangeEvent,
  ComponentPropsWithoutRef,
  FormEvent,
  useCallback,
  useState
} from 'react'

import cn from 'classnames'

import { audiusSdk } from 'services/audius-sdk'

import styles from './ChatComposer.module.css'

export type ChatComposerProps = ComponentPropsWithoutRef<'div'> & {
  chatId?: string
}

export const ChatComposer = (props: ChatComposerProps) => {
  const { chatId } = props
  const [message, setMessage] = useState('')
  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setMessage(e.target.value)
    },
    [setMessage]
  )
  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      if (chatId) {
        const sdk = await audiusSdk()
        await sdk.chats!.message({ chatId, message })
        setMessage('')
      }
    },
    [chatId, message, setMessage]
  )
  return (
    <div className={cn(styles.root, props.className)}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <input
          disabled={!chatId}
          className={styles.input}
          type='text'
          value={message}
          onChange={handleInputChange}
        />
      </form>
    </div>
  )
}
