import { useCallback, useState } from 'react'

import type { ID } from '@audius/common/models'
import { chatActions } from '@audius/common/store'
import type { Nullable } from '@audius/common/utils'
import { decodeHashId } from '@audius/common/utils'
import { Platform } from 'react-native'
import { useDispatch } from 'react-redux'

import { Flex } from '@audius/harmony-native'
import { ComposerInput } from 'app/components/composer-input'
import { spacing } from 'app/styles/spacing'

import { ComposerCollectionInfo, ComposerTrackInfo } from './ComposePreviewInfo'

const { sendMessage } = chatActions

const messages = {
  startNewMessage: ' Start typing...'
}

type ChatTextInputProps = {
  chatId: string
  extraOffset?: number // Additional padding needed if screen header size changes
  presetMessage?: string
  onMessageSent: () => void
}

export const ChatTextInput = ({
  chatId,
  extraOffset = 0,
  presetMessage,
  onMessageSent
}: ChatTextInputProps) => {
  const dispatch = useDispatch()
  const [messageId, setMessageId] = useState(0)
  // The track and collection ids used to render the composer preview
  const [trackId, setTrackId] = useState<Nullable<ID>>(null)
  const [collectionId, setCollectionId] = useState<Nullable<ID>>(null)

  const handleChange = useCallback(
    // (value: string, linkEntities: LinkEntity[]) => {
    (value: string, linkEntities: any[]) => {
      const track = linkEntities.find((e) => e.type === 'track')
      setTrackId(track ? decodeHashId(track.data.id) : null)

      const collection = linkEntities.find((e) => e.type === 'collection')
      setCollectionId(collection ? decodeHashId(collection.data.id) : null)
    },
    []
  )

  const handleSubmit = useCallback(
    async (value: string) => {
      if (chatId && value) {
        dispatch(sendMessage({ chatId, message: value }))
        onMessageSent()
        setMessageId((id) => ++id)
      }
    },
    [chatId, dispatch, onMessageSent]
  )

  // For iOS: default padding + extra padding
  // For Android: extra padding is slightly larger than iOS, and only
  // needed if the screen header size changes
  const offset =
    Platform.OS === 'ios'
      ? spacing(1.5) + extraOffset
      : Platform.OS === 'android'
      ? extraOffset
        ? spacing(1.5) + extraOffset
        : undefined
      : undefined

  return (
    <Flex>
      {trackId ? (
        <ComposerTrackInfo trackId={trackId} />
      ) : collectionId ? (
        <ComposerCollectionInfo collectionId={collectionId} />
      ) : null}

      <Flex
        style={{
          position: 'relative',
          paddingBottom: offset
        }}
      >
        <ComposerInput
          messageId={messageId}
          presetMessage={presetMessage}
          placeholder={messages.startNewMessage}
          onChange={handleChange}
          onSubmit={handleSubmit}
        />
      </Flex>
    </Flex>
  )
}
