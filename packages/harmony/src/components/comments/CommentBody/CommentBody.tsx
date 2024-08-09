import { useRef, useState } from 'react'

import { useEffectOnce } from 'react-use'

import { Flex } from 'components/layout'
import { Text } from 'components/text'
import { TextLink } from 'components/text-link'

import { CommentBodyProps } from './types'

const messages = {
  seeMore: 'See More',
  seeLess: 'See Less'
}

export const CommentBody = ({ children }: CommentBodyProps) => {
  const textRef = useRef<HTMLElement>()
  const [isOverflown, setIsOverflown] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffectOnce(() => {
    setIsOverflown(
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
      {isOverflown ? (
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
