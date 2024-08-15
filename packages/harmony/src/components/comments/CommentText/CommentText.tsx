import { useRef, useState } from 'react'

import { useEffectOnce } from 'react-use'

import { Flex } from 'components/layout'
import { Text } from 'components/text'
import { TextLink } from 'components/text-link'

import { CommentTextProps } from './types'

const messages = {
  seeMore: 'See More',
  seeLess: 'See Less'
}

export const CommentText = ({ children }: CommentTextProps) => {
  const textRef = useRef<HTMLElement>()
  const [isOverflowing, setIsOverflowing] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffectOnce(() => {
    setIsOverflowing(
      (textRef.current &&
        textRef.current.offsetHeight < textRef.current.scrollHeight) ||
        false
    )
  })

  return (
    <Flex direction='column' alignItems='flex-start' gap='xs'>
      <Text
        // @ts-ignore
        ref={textRef}
        variant='body'
        size='s'
        color='default'
        maxLines={isExpanded ? undefined : 3}
      >
        {children}
      </Text>
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
