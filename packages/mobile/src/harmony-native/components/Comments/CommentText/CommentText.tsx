import { useCallback, useState } from 'react'

import { commentsMessages as messages } from '@audius/common/messages'
import { timestampRegex } from '@audius/common/utils'
import type { CommentTextProps } from '@audius/harmony/src/components/comments/CommentText/types'

import { Flex, Text, TextLink } from '@audius/harmony-native'
import { UserGeneratedText } from 'app/components/core'

const MAX_LINES = 3

export const CommentText = ({ children, isEdited }: CommentTextProps) => {
  const [isOverflowing, setIsOverflowing] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

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
            renderLink: (match) => {
              return (
                <TextLink
                  onPress={() => {
                    // TODO: play track at timestamp
                  }}
                  variant='visible'
                  size='s'
                >
                  {match}
                </TextLink>
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
