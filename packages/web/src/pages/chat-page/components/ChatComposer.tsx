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
  formatCollectionName,
  formatTrackName,
  formatUserName,
  matchAudiusLinks,
  splitOnNewline
} from '@audius/common/utils'
import { IconSend, IconButton, Text, TextProps } from '@audius/harmony'
import { Track, Playlist, User, ResolveApi } from '@audius/sdk'
import cn from 'classnames'
import { useDispatch } from 'react-redux'

import { TextAreaV2 } from 'components/data-entry/TextAreaV2'
import { audiusSdk } from 'services/audius-sdk'
import { env } from 'services/env'

import styles from './ChatComposer.module.css'
import { ComposerCollectionInfo, ComposerTrackInfo } from './ComposePreviewInfo'

const { sendMessage } = chatActions
const {
  instanceOfTrackResponse,
  instanceOfUserResponse,
  instanceOfPlaylistResponse
} = ResolveApi

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

  // Maintain bidirectional maps of audius links to human readable format
  const linkToHuman = useRef<{ [key: string]: string }>({}).current
  const humanToData = useRef<{
    [key: string]: { link: string; data: Track | Playlist | User }
  }>({}).current

  // The track id used to render the composer preview
  const [trackId, setTrackId] = useState<ID | null>(null)
  // The collection id used to render the composer preview
  const [collectionId, setCollectionId] = useState<ID | null>(null)

  const ref = useRef<HTMLTextAreaElement>(null)
  const chatIdRef = useRef(chatId)

  const resolveLinks = useCallback(
    async (value: string) => {
      setValue(value)

      const { matches } = matchAudiusLinks({
        text: value,
        hostname: env.PUBLIC_HOSTNAME
      })

      const sdk = await audiusSdk()
      for (const match of matches) {
        if (!(match in linkToHuman)) {
          const res = await sdk.resolve({ url: match })
          if (res.data) {
            if (instanceOfTrackResponse(res)) {
              const human = formatTrackName({ track: res.data })
              linkToHuman[match] = human
              humanToData[human] = { link: match, data: res.data }
            } else if (instanceOfPlaylistResponse(res)) {
              const human = formatCollectionName({ collection: res.data[0] })
              linkToHuman[match] = human
              humanToData[human] = { link: match, data: res.data[0] }
            } else if (instanceOfUserResponse(res)) {
              const human = formatUserName({ user: res.data })
              linkToHuman[match] = human
              humanToData[human] = { link: match, data: res.data }
            }
          }
        } else {
          // If we already loaded the track, delay showing by 500ms
          // to give the user some sense of what is happening.
          await new Promise((resolve) => setTimeout(resolve, 500))
        }
      }

      // Sort here to make sure that we replace all content before
      // replacing their substrings.
      let editedValue = value
      for (const [link, human] of Object.entries(linkToHuman).sort(
        (a, b) => b[0].length - a[0].length
      )) {
        editedValue = editedValue.replaceAll(link, human)
      }
      setValue(editedValue)
    },
    [setValue, linkToHuman, humanToData]
  )

  useEffect(() => {
    if (presetMessage) {
      resolveLinks(presetMessage)
    }
  }, [presetMessage, resolveLinks])

  const handleChange = useCallback(
    async (e: ChangeEvent<HTMLTextAreaElement>) => {
      resolveLinks(e.target.value)
    },
    [resolveLinks]
  )

  useEffect(() => {
    for (const [human, { data }] of Object.entries(humanToData)) {
      if (value.includes(human)) {
        if ('title' in data) {
          setTrackId(decodeHashId(data.id))
        } else if (
          Array.isArray(data) &&
          data.length > 0 &&
          'playlistName' in data[0]
        ) {
          setCollectionId(decodeHashId(data.id))
        }
        return
      }
    }
    setTrackId(null)
    setCollectionId(null)
  }, [trackId, humanToData, value])

  const handleSubmit = useCallback(
    async (e?: FormEvent) => {
      e?.preventDefault()
      if (chatId && value) {
        // On submit, actually send audius links rather than the human readable format
        let editedValue = value
        for (const [human, { link }] of Object.entries(humanToData)) {
          editedValue = editedValue.replaceAll(human, link)
        }
        dispatch(sendMessage({ chatId, message: editedValue }))
        setValue('')
        onMessageSent()
      }
    },
    [chatId, value, onMessageSent, humanToData, dispatch]
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
        const matched = Object.keys(humanToData).find((i) =>
          textBeforeCursor.endsWith(i)
        )
        if (matched) {
          e.preventDefault()
          setValue(
            (value) =>
              value.slice(0, cursorPosition - matched.length) +
              value.slice(cursorPosition)
          )
        }
      }
    },
    [handleSubmit, setValue, humanToData]
  )

  // Set focus and clear on new chat selected
  useEffect(() => {
    if (chatId) {
      ref.current?.focus()
    }
    if (chatId !== chatIdRef.current) {
      setValue('')
      setTrackId(null)
      setCollectionId(null)
      chatIdRef.current = chatId
    }
  }, [ref, chatId, chatIdRef, setTrackId, setValue])

  const renderChatDisplay = (value: string) => {
    const regexString = Object.keys(humanToData).join('|')
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
