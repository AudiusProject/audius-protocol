import React, { useCallback, useEffect, useRef, useState } from 'react'

import {
  Flex,
  Text,
  IconButton,
  IconCaretLeft,
  IconCaretRight,
  useMedia
} from '@audius/harmony'

type ExploreSectionProps = {
  title: string
  data?: number[]
  Card: React.ComponentType<any>
}
export const ExploreSection: React.FC<ExploreSectionProps> = ({
  title,
  data,
  Card
}) => {
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const { isLarge } = useMedia()

  const updateScrollButtons = useCallback(() => {
    const container = scrollContainerRef.current
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0)
      setCanScrollRight(
        container.scrollLeft + container.clientWidth < container.scrollWidth - 1
      )
    }
  }, [])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    updateScrollButtons()
    container.addEventListener('scroll', updateScrollButtons)
    window.addEventListener('resize', updateScrollButtons)

    return () => {
      container.removeEventListener('scroll', updateScrollButtons)
      window.removeEventListener('resize', updateScrollButtons)
    }
  }, [updateScrollButtons])
  if (!data) return null

  return (
    <Flex direction='column' gap='l'>
      <Flex
        gap='m'
        alignItems='center'
        alignSelf='stretch'
        justifyContent='space-between'
      >
        <Text variant='heading'>{title}</Text>
        {canScrollLeft || canScrollRight ? (
          <Flex gap='l'>
            <IconButton
              icon={IconCaretLeft}
              color={canScrollLeft ? 'default' : 'disabled'}
              aria-label={`${title} scroll left`}
              onClick={() => {
                scrollContainerRef.current?.scrollBy({
                  left: -648,
                  behavior: 'smooth'
                })
              }}
            />
            <IconButton
              icon={IconCaretRight}
              color={canScrollRight ? 'default' : 'disabled'}
              aria-label={`${title} scroll right`}
              onClick={() => {
                scrollContainerRef.current?.scrollBy({
                  left: 648,
                  behavior: 'smooth'
                })
              }}
            />
          </Flex>
        ) : null}
      </Flex>
      <Flex
        css={
          isLarge
            ? {
                marginRight: '-50vw',
                marginLeft: '-50vw',
                overflow: 'visible'
              }
            : null
        }
      >
        <Flex
          ref={scrollContainerRef}
          css={{
            overflowX: 'auto',

            scrollbarWidth: 'none', // Firefox
            msOverflowStyle: 'none', // IE/Edge
            '&::-webkit-scrollbar': {
              display: 'none' // Chrome/Safari
            },
            paddingRight: isLarge ? '50vw' : undefined,
            paddingLeft: isLarge ? '50vw' : undefined
          }}
        >
          <Flex gap='l' css={{ minWidth: 'max-content' }} pv='2xs'>
            {data?.map((id) => <Card key={id} id={id} size='s' />)}
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
}
