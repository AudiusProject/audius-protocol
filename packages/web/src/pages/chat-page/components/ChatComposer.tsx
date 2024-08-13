import {
  ChangeEvent,
  ComponentPropsWithoutRef,
  FormEvent,
  useCallback,
  useState,
  useRef,
  useEffect
} from 'react'

import { ID } from '@audius/common/models'
import { chatActions } from '@audius/common/store'
import {
  decodeHashId,
  formatTrackName,
  matchAudiusLinks
} from '@audius/common/utils'
import { IconSend, IconButton, Text, TextProps } from '@audius/harmony'
import { Track } from '@audius/sdk'
import cn from 'classnames'
import { useDispatch } from 'react-redux'

import { TextAreaV2 } from 'components/data-entry/TextAreaV2'
import { audiusSdk } from 'services/audius-sdk'
import { env } from 'services/env'

import styles from './ChatComposer.module.css'
import { ComposerTrackInfo } from './ComposeTrackInfo'

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

/**
 * Custom split function that splits on \n, removing empty results
 * and keeping the \n in the returned array.
 * - hello\nworld becomes ['hello', '\n', 'world']
 * - hello\n becomes ['hello', '\n']
 * @param s
 * @returns array of parts
 */
const splitOnNewline = (s: string) => {
  return s.split(/(\n)/).filter(Boolean)
}

type ChatSendButtonProps = { disabled: boolean }

export const ChatSendButton = ({ disabled }: ChatSendButtonProps) => {
  return (
    <IconButton
      className={styles.sendButton}
      disabled={disabled}
      aria-label={messages.sendMessage}
      type='submit'
      size='m'
      icon={IconSend}
      color='active'
    />
  )
}

const ComposerText = ({
  color,
  children
}: Pick<TextProps, 'color' | 'children'>) => {
  if (children === '\n') {
    return <br />
  }
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

  // Maintain bidirectional maps of audius links to human readable format
  const linkToHuman = useRef<{ [key: string]: string }>({}).current
  const humanToTrack = useRef<{
    [key: string]: { link: string; track: Track }
  }>({}).current

  // The track id used to render the composer preview
  const [trackId, setTrackId] = useState<ID | null>(null)

  const ref = useRef<HTMLTextAreaElement>(null)
  const chatIdRef = useRef(chatId)

  const handleChange = useCallback(
    async (e: ChangeEvent<HTMLTextAreaElement>) => {
      const originalValue = e.target.value
      setValue(originalValue)

      const { matches } = matchAudiusLinks({
        text: originalValue,
        hostname: env.PUBLIC_HOSTNAME
      })

      const sdk = await audiusSdk()
      for (const match of matches) {
        if (!(match in linkToHuman)) {
          const { data: track } = await sdk.resolve.resolve({ url: match })
          if (track && 'title' in track) {
            const human = formatTrackName({ track })
            linkToHuman[match] = human
            humanToTrack[human] = { link: match, track }
          }
        } else {
          // If we already loaded the track, delay showing by 500ms
          // to give the user some sense of what is happening.
          await new Promise((resolve) => setTimeout(resolve, 500))
        }
      }

      let editedValue = originalValue
      for (const [link, human] of Object.entries(linkToHuman)) {
        editedValue = editedValue.replaceAll(link, human)
      }
      setValue(editedValue)
    },
    [setValue, linkToHuman, humanToTrack]
  )

  useEffect(() => {
    for (const [human, { track }] of Object.entries(humanToTrack)) {
      if (value.includes(human)) {
        setTrackId(decodeHashId(track.id))
        return
      }
    }
    setTrackId(null)
  }, [trackId, humanToTrack, value])

  const handleSubmit = useCallback(
    async (e?: FormEvent) => {
      e?.preventDefault()
      if (chatId && value) {
        let editedValue = value
        for (const [human, { link }] of Object.entries(humanToTrack)) {
          editedValue = value.replaceAll(human, link)
        }
        dispatch(sendMessage({ chatId, message: editedValue }))
        setValue('')
        onMessageSent()
      }
    },
    [chatId, value, setValue, humanToTrack, dispatch, onMessageSent]
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
      setTrackId(null)
      chatIdRef.current = chatId
    }
  }, [ref, chatId, chatIdRef, setTrackId, setValue])

  const renderChatDisplay = () => {
    const regexString = Object.keys(humanToTrack).join('|')
    const regex = regexString ? new RegExp(regexString, 'gi') : null
    if (!regex) {
      const text = splitOnNewline(value)
      return text.map((t, i) => (
        <ComposerText key={i} color='default'>
          {t}
        </ComposerText>
      ))
    }
    const matches = value.matchAll(regex)
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
      {trackId ? <ComposerTrackInfo trackId={trackId} /> : null}
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
          grows
          displayElement={renderChatDisplay()}
        >
          <ChatSendButton disabled={!value} />
        </TextAreaV2>
      </form>
    </div>
  )
}
