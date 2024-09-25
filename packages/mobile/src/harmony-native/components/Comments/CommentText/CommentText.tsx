import { useCallback, useState } from 'react'

import { useCurrentCommentSection } from '@audius/common/context'
import { useGatedContentAccess } from '@audius/common/hooks'
import { commentsMessages as messages } from '@audius/common/messages'
import { isContentUSDCPurchaseGated, ModalSource } from '@audius/common/models'
import {
  playerActions,
  PurchaseableContentType,
  trackPageLineupActions,
  trackPageSelectors,
  usePremiumContentPurchaseModal
} from '@audius/common/store'
import {
  getDurationFromTimestampMatch,
  timestampRegex
} from '@audius/common/utils'
import type { CommentTextProps } from '@audius/harmony/src/components/comments/CommentText/types'
import { useDispatch, useSelector } from 'react-redux'

import { Flex, Text, TextLink } from '@audius/harmony-native'
import { UserGeneratedText } from 'app/components/core'
const { tracksActions } = trackPageLineupActions
const { getLineup } = trackPageSelectors

const { seek } = playerActions

const MAX_LINES = 3

type TimestampLinkProps = {
  timestamp: string
  timestampSeconds: number
}

const TimestampLink = (props: TimestampLinkProps) => {
  const { timestamp, timestampSeconds } = props

  const dispatch = useDispatch()
  const { track } = useCurrentCommentSection()
  const lineup = useSelector(getLineup)
  const { track_id: trackId, stream_conditions: streamConditions } = track

  const isUSDCPurchaseGated = isContentUSDCPurchaseGated(streamConditions)
  const { hasStreamAccess } = useGatedContentAccess(track)

  const isLocked = isUSDCPurchaseGated && !hasStreamAccess

  const uid = lineup?.entries?.[0]?.uid
  const { onOpen: openPremiumContentPurchaseModal } =
    usePremiumContentPurchaseModal()

  return (
    <TextLink
      onPress={() => {
        if (isLocked) {
          openPremiumContentPurchaseModal(
            { contentId: trackId, contentType: PurchaseableContentType.TRACK },
            {
              source: ModalSource.Comment
            }
          )
        } else {
          dispatch(tracksActions.play(uid))
          dispatch(seek({ seconds: timestampSeconds }))
        }
      }}
      variant='visible'
      size='s'
    >
      {timestamp}
    </TextLink>
  )
}

export const CommentText = ({ children, isEdited }: CommentTextProps) => {
  const [isOverflowing, setIsOverflowing] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const {
    track: { duration }
  } = useCurrentCommentSection()

  const onTextLayout = useCallback(
    (e) => {
      if (e.nativeEvent.lines.length > MAX_LINES && !isOverflowing) {
        setIsOverflowing(true)
      }
    },
    [isOverflowing]
  )

  return (
    <Flex alignItems='flex-start' gap='xs'>
      <UserGeneratedText
        variant='body'
        size='s'
        lineHeight='multi'
        onTextLayout={onTextLayout}
        numberOfLines={isOverflowing && !isExpanded ? MAX_LINES : undefined}
        internalLinksOnly
        suffix={
          isEdited ? (
            <>
              <Text size='s'>&nbsp;</Text>
              <Text color='subdued' size='xs'>
                ({messages.edited})
              </Text>
            </>
          ) : null
        }
        matchers={[
          {
            pattern: timestampRegex,
            renderLink: (text) => {
              const matches = [...text.matchAll(timestampRegex)]
              if (matches.length === 0) return null

              const timestampSeconds = getDurationFromTimestampMatch(matches[0])
              const showLink = timestampSeconds <= duration

              return showLink ? (
                <TimestampLink
                  timestamp={text}
                  timestampSeconds={timestampSeconds}
                />
              ) : (
                <Text size='s'>{text}</Text>
              )
            }
          }
        ]}
      >
        {children}
      </UserGeneratedText>

      {isOverflowing ? (
        <TextLink
          size='s'
          variant='visible'
          onPress={() => setIsExpanded((val) => !val)}
        >
          {isExpanded ? messages.seeLess : messages.seeMore}
        </TextLink>
      ) : null}
    </Flex>
  )
}
