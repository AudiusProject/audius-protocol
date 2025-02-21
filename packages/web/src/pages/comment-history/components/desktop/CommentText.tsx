import { MouseEvent, useCallback, useEffect, useRef, useState } from 'react'

import { commentsMessages as messages } from '@audius/common/messages'
import { ID, Name } from '@audius/common/models'
import { Flex, Text, TextLink } from '@audius/harmony'
import { CommentMention } from '@audius/sdk'
import { useToggle } from 'react-use'

import { LinkKind } from 'components/link'
import { UserGeneratedTextV2 } from 'components/user-generated-text/UserGeneratedTextV2'
import { track as trackEvent, make } from 'services/analytics'

type CommentTextProps = {
  children: string
  mentions: CommentMention[]
  isEdited?: boolean
  isPreview?: boolean
  commentId: ID
}

export const CommentText = (props: CommentTextProps) => {
  const { children, isEdited, mentions, isPreview, commentId } = props
  const textRef = useRef<HTMLElement>()
  const [isOverflowing, setIsOverflowing] = useState(false)
  const [isExpanded, toggleIsExpanded] = useToggle(false)

  useEffect(() => {
    setIsOverflowing(
      (textRef.current &&
        textRef.current.offsetHeight < textRef.current.scrollHeight) ||
        false
    )
  }, [children])

  const handleClickLink = useCallback(
    (e: MouseEvent, linkKind: LinkKind, linkEntityId?: ID) => {
      if (linkKind === 'mention' && linkEntityId) {
        trackEvent(
          make({
            eventName: Name.COMMENTS_CLICK_MENTION,
            userId: linkEntityId,
            commentId
          })
        )
      } else {
        trackEvent(
          make({
            eventName: Name.COMMENTS_CLICK_LINK,
            commentId,
            kind: linkKind as 'track' | 'collection' | 'user' | 'other',
            entityId: linkEntityId
          })
        )
      }
    },
    [commentId]
  )

  return (
    <Flex direction='column' alignItems='flex-start' gap='xs'>
      <UserGeneratedTextV2
        ref={textRef}
        mentions={mentions}
        internalLinksOnly
        maxLines={isExpanded ? undefined : 3}
        css={{
          textAlign: 'left',
          wordBreak: 'break-word',
          userSelect: 'text'
        }}
        suffix={
          isEdited ? <Text color='subdued'> ({messages.edited})</Text> : null
        }
        linkProps={{
          onClick: handleClickLink
        }}
      >
        {children}
      </UserGeneratedTextV2>

      {isOverflowing && !isPreview ? (
        <TextLink variant='visible' onClick={toggleIsExpanded}>
          {isExpanded ? messages.seeLess : messages.seeMore}
        </TextLink>
      ) : null}
    </Flex>
  )
}
