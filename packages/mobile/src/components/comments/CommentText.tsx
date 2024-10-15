import { useCallback, useState } from 'react'

import { useCurrentCommentSection } from '@audius/common/context'
import { commentsMessages as messages } from '@audius/common/messages'
import {
  getDurationFromTimestampMatch,
  timestampRegex
} from '@audius/common/utils'

import { Flex, Text, TextLink } from '@audius/harmony-native'
import { UserGeneratedText } from 'app/components/core'

import { TimestampLink } from './TimestampLink'

const MAX_LINES = 3

export type CommentTextProps = {
  children: string
  isEdited?: boolean
}

export const CommentText = (props: CommentTextProps) => {
  const { children, isEdited } = props
  const [isOverflowing, setIsOverflowing] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const {
    track: { duration },
    navigation,
    setIsDrawerOpen
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
        navigation={navigation}
        linkProps={{
          onPress: () => {
            setIsDrawerOpen?.(false)
          }
        }}
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
                <TimestampLink timestampSeconds={timestampSeconds} />
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
