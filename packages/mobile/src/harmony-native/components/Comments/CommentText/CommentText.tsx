import { useCallback, useState } from 'react'

import type { CommentTextProps } from '@audius/harmony/src/components/comments/CommentText/types'

import { Flex, Text, TextLink } from '../..'

const MAX_LINES = 3

const messages = {
  seeMore: 'See More',
  seeLess: 'See Less'
}

export const CommentText = ({ children }: CommentTextProps) => {
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
      <Text
        variant='body'
        size='s'
        color='default'
        onTextLayout={onTextLayout}
        numberOfLines={isOverflowing && !isExpanded ? MAX_LINES : undefined}
      >
        {children}
      </Text>
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
