import {
  ChangeEvent,
  ComponentPropsWithoutRef,
  FormEvent,
  useCallback,
  useState,
  useRef,
  useEffect
} from 'react'

import { useAudiusLinkResolver } from '@audius/common/hooks'
import { chatActions } from '@audius/common/store'
import { splitOnNewline } from '@audius/common/utils'
import { IconSend, IconButton, Text, TextProps } from '@audius/harmony'
import cn from 'classnames'
import { useDispatch } from 'react-redux'

import { TextAreaV2 } from 'components/data-entry/TextAreaV2'
import { audiusSdk } from 'services/audius-sdk'
import { env } from 'services/env'

import styles from './ChatComposer.module.css'
import { ComposerCollectionInfo, ComposerTrackInfo } from './ComposePreviewInfo'

const { sendMessage } = chatActions
const messages = {
  sendMessage: 'Send Message',
  sendMessagePlaceholder: 'Start typing...'
}

const ENTER_KEY = 'Enter'
const BACKSPACE_KEY = 'Backspace'

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
      disabled={disabled}
      aria-label={messages.sendMessage}
      type='submit'
      size='m'
      icon={IconSend}
      height={24}
      width={24}
      color='active'
    />
  )
}

const ComposerText = ({
  color,
  children
}: Pick<TextProps, 'color' | 'children'>) => {
  return (
    <Text style={{ whiteSpace: 'pre-wrap' }} color={color}>
      {children}
    </Text>
  )
}

export const ChatComposer = (props: ChatComposerProps) => {
  const { chatId, presetMessage, onMessageSent } = props
  const dispatch = useDispatch()

  const [value, setValue] = useState(presetMessage ?? '')
  const [focused, setFocused] = useState(false)

  const ref = useRef<HTMLTextAreaElement>(null)
  const chatIdRef = useRef(chatId)

  const {
    trackId,
    collectionId,
    resolveLinks,
    restoreLinks,
    getMatches,
    handleBackspace,
    reset
  } = useAudiusLinkResolver({
    value,
    hostname: env.PUBLIC_HOSTNAME,
    audiusSdk
  })

  useEffect(() => {
    const fn = async () => {
      if (presetMessage) {
        const editedValue = await resolveLinks(presetMessage)
        setValue(editedValue)
      }
    }
    fn()
  }, [presetMessage, resolveLinks])

  const handleChange = useCallback(
    async (e: ChangeEvent<HTMLTextAreaElement>) => {
      setValue(e.target.value)
      const editedValue = await resolveLinks(e.target.value)
      setValue(editedValue)
    },
    [resolveLinks, setValue]
  )

  const handleSubmit = useCallback(
    async (e?: FormEvent) => {
      e?.preventDefault()
      if (chatId && value) {
        // On submit, actually send audius links rather than the human readable format
        dispatch(sendMessage({ chatId, message: restoreLinks(value) }))
        setValue('')
        onMessageSent()
      }
    },
    [chatId, value, onMessageSent, restoreLinks, dispatch]
  )

  // Submit when pressing enter while not holding shift
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Submit on enter
      if (e.key === ENTER_KEY && !e.shiftKey) {
        e.preventDefault()
        handleSubmit()
      }
      // Delete any matched values with a single backspace
      if (e.key === BACKSPACE_KEY) {
        const textarea = e.target as HTMLTextAreaElement
        const cursorPosition = textarea.selectionStart
        const textBeforeCursor = textarea.value.slice(0, cursorPosition)
        const editValue = handleBackspace({
          cursorPosition,
          textBeforeCursor
        })
        if (editValue) {
          e.preventDefault()
          setValue(editValue)
        }
      }
    },
    [handleSubmit, setValue, handleBackspace]
  )

  // Set focus and clear on new chat selected
  useEffect(() => {
    if (chatId) {
      ref.current?.focus()
    }
    if (chatId !== chatIdRef.current) {
      setValue('')
      reset()
      chatIdRef.current = chatId
    }
  }, [ref, chatId, chatIdRef, reset, setValue])

  const renderChatDisplay = (value: string) => {
    const matches = getMatches(value)
    if (!matches) {
      const text = splitOnNewline(value)
      return text.map((t, i) => (
        <ComposerText key={i} color='default'>
          {t}
        </ComposerText>
      ))
    }
    const parts = []
    let lastIndex = 0
    for (const match of matches) {
      const { index } = match
      if (index === undefined) {
        continue
      }

      if (index > lastIndex) {
        // Add text before the match
        const text = splitOnNewline(value.slice(lastIndex, index))
        parts.push(
          ...text.map((t, i) => (
            <ComposerText color='default' key={`${lastIndex}${i}`}>
              {t}
            </ComposerText>
          ))
        )
      }
      // Add the matched word with accent color
      parts.push(
        <Text color='accent' key={index}>
          {match[0]}
        </Text>
      )
      // Update lastIndex to the end of the current match
      lastIndex = index + match[0].length
    }

    // Add remaining text after the last match
    if (lastIndex < value.length) {
      const text = splitOnNewline(value.slice(lastIndex))
      parts.push(
        ...text.map((t, i) => (
          <ComposerText color='default' key={`${lastIndex}${i}`}>
            {t}
          </ComposerText>
        ))
      )
    }

    return parts
  }

  return (
    <div className={cn(styles.root, props.className)}>
      {trackId ? (
        <ComposerTrackInfo trackId={trackId} />
      ) : collectionId ? (
        <ComposerCollectionInfo collectionId={collectionId} />
      ) : null}
      <form className={styles.form} onSubmit={handleSubmit}>
        <TextAreaV2
          className={cn(styles.textArea, { [styles.focused]: focused })}
          ref={ref}
          rows={1}
          placeholder={messages.sendMessagePlaceholder}
          onKeyDown={handleKeyDown}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          value={value}
          maxVisibleRows={10}
          maxLength={MAX_MESSAGE_LENGTH}
          showMaxLength={!!value && value.length > MAX_MESSAGE_LENGTH * 0.85}
          renderDisplayElement={renderChatDisplay}
          grows
        >
          <ChatSendButton disabled={!value} />
        </TextAreaV2>
      </form>
    </div>
  )
}
