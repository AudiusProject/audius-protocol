import { useCallback, useEffect, useRef, useState } from 'react'

import { useCurrentCommentSection } from '@audius/common/context'
import { commentsMessages as messages } from '@audius/common/messages'
import { ID } from '@audius/common/models'
import {
  getDurationFromTimestampMatch,
  timestampRegex
} from '@audius/common/utils'
import { Flex, Text, TextLink } from '@audius/harmony'

import { UserGeneratedTextV2 } from 'components/user-generated-text/UserGeneratedTextV2'

import { TimestampLink } from './TimestampLink'

export type CommentTextProps = {
  children: string
  isEdited?: boolean
  onUserMentionsChange?: (userIds: ID[]) => void
}

export const CommentText = (props: CommentTextProps) => {
  const { children, isEdited, onUserMentionsChange } = props
  const textRef = useRef<HTMLElement>()
  const [isOverflowing, setIsOverflowing] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const {
    track: { duration }
  } = useCurrentCommentSection()

  const handleUserIdsChange = useCallback(
    (userIds: ID[]) => {
      onUserMentionsChange?.(userIds)
    },
    [onUserMentionsChange]
  )

  useEffect(() => {
    setIsOverflowing(
      (textRef.current &&
        textRef.current.offsetHeight < textRef.current.scrollHeight) ||
        false
    )
  }, [children])

  return (
    <Flex direction='column' alignItems='flex-start' gap='xs'>
      <UserGeneratedTextV2
        size='s'
        variant='body'
        color='default'
        ref={textRef}
        onUserIdsChange={handleUserIdsChange}
        internalLinksOnly
        maxLines={isExpanded ? undefined : 3}
        css={{ textAlign: 'left', wordBreak: 'break-word' }}
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

              const timestampSeconds = getDurationFromTimestampMatch(matches[0])
              const showLink = timestampSeconds <= duration

              return showLink ? (
                <TimestampLink
                  key={index}
                  timestampSeconds={timestampSeconds}
                />
              ) : null
            }
          }
        ]}
      >
        {children}
      </UserGeneratedTextV2>

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
