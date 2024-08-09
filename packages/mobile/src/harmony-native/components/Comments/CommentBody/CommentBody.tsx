import { useCallback, useState } from 'react'

import type { CommentBodyProps } from '@audius/harmony/src/components/comments/CommentBody/types'

import { Flex, Text, TextLink } from '../..'

const MAX_LINES = 3

const messages = {
  seeMore: 'See More',
  seeLess: 'See Less'
}

export const CommentBody = ({ children }: CommentBodyProps) => {
  const [isOverflown, setIsOverflown] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const onTextLayout = useCallback(
    (e) => {
      if (e.nativeEvent.lines.length > MAX_LINES && !isOverflown) {
        setIsOverflown(true)
      }
    },
    [isOverflown]
  )

  return (
    <Flex alignItems='flex-start' gap='xs'>
      <Text
        variant='body'
        size='s'
        color='default'
        onTextLayout={onTextLayout}
        numberOfLines={isOverflown && !isExpanded ? MAX_LINES : undefined}
      >
        {children}
      </Text>
      {isOverflown ? (
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
