import { useRef, useState } from 'react'

import { Flex, Text, TextLink } from '@audius/harmony'
import { useEffectOnce } from 'react-use'

const messages = {
  seeMore: 'See More',
  seeLess: 'See Less'
}

export type CommentTextProps = {
  children: string
  isEdited?: boolean
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
        // Issue with the HTMLElement ref here and the ref type for Text component
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
