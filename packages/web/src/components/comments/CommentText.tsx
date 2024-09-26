import { useEffect, useRef, useState } from 'react'

import { useCurrentCommentSection } from '@audius/common/context'
import { useGatedContentAccess } from '@audius/common/hooks'
import { commentsMessages as messages } from '@audius/common/messages'
import { ModalSource } from '@audius/common/models'
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
import { Flex, Text, TextLink } from '@audius/harmony'
import { useDispatch, useSelector } from 'react-redux'
import { useEffectOnce } from 'react-use'

import { UserGeneratedTextV2 } from 'components/user-generated-text/UserGeneratedTextV2'

const { tracksActions } = trackPageLineupActions
const { getLineup } = trackPageSelectors
const { seek } = playerActions

type TimestampLinkProps = {
  timestamp: string
  timestampSeconds: number
}

const TimestampLink = (props: TimestampLinkProps) => {
  const { timestamp, timestampSeconds } = props

  const dispatch = useDispatch()
  const { track } = useCurrentCommentSection()
  const lineup = useSelector(getLineup)
  const { track_id: trackId } = track

  const { hasStreamAccess } = useGatedContentAccess(track)

  const uid = lineup?.entries?.[0]?.uid
  const { onOpen: openPremiumContentPurchaseModal } =
    usePremiumContentPurchaseModal()

  return (
    <TextLink
      onClick={() => {
        if (!hasStreamAccess) {
          openPremiumContentPurchaseModal(
            { contentId: trackId, contentType: PurchaseableContentType.TRACK },
            {
              source: ModalSource.Comment
            }
          )
        } else {
          dispatch(tracksActions.play(uid))
          setTimeout(() => {
            dispatch(seek({ seconds: timestampSeconds }))
          })
        }
      }}
      variant='visible'
      size='s'
    >
      {timestamp}
    </TextLink>
  )
}

export type CommentTextProps = {
  children: string
  isEdited?: boolean
}

export const CommentText = (props: CommentTextProps) => {
  const { children, isEdited } = props
  const textRef = useRef<HTMLElement>()
  const [isOverflowing, setIsOverflowing] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const {
    track: { duration }
  } = useCurrentCommentSection()

  useEffect(() => {
    setIsOverflowing(
      (textRef.current &&
        textRef.current.offsetHeight < textRef.current.scrollHeight) ||
        false
    )
  }, [children])

  return (
    <Flex direction='column' alignItems='flex-start' gap='xs'>
      <p css={{ textAlign: 'left' }}>
        <UserGeneratedTextV2
          size='s'
          variant='body'
          color='default'
          ref={textRef}
          internalLinksOnly
          maxLines={isExpanded ? undefined : 3}
          suffix={
            isEdited ? (
              <Text color='subdued' size='s'>
                {' '}
                ({messages.edited})
              </Text>
            ) : null
          }
          matchers={[
            {
              pattern: timestampRegex,
              renderLink: (text, _, index) => {
                const matches = [...text.matchAll(new RegExp(timestampRegex))]

                if (matches.length === 0) return null

                const timestampSeconds = getDurationFromTimestampMatch(
                  matches[0]
                )
                const showLink = timestampSeconds <= duration

                return showLink ? (
                  <TimestampLink
                    key={index}
                    timestamp={text}
                    timestampSeconds={timestampSeconds}
                  />
                ) : null
              }
            }
          ]}
        >
          {children}
        </UserGeneratedTextV2>
      </p>

      {isOverflowing ? (
        <TextLink
          size='s'
          variant='visible'
          onClick={() => setIsExpanded((val) => !val)}
        >
          {isExpanded ? messages.seeLess : messages.seeMore}
        </TextLink>
      ) : null}
    </Flex>
  )
}
