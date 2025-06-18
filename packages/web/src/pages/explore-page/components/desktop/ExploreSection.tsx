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
  const [canScrollRight, setCanScrollRight] = useState(true)
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
  })

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
              ripple
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
              ripple
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
            overscrollBehaviorX: 'contain', // prevents back gesture on chrome

            // Some logic to make sure card shadows are not cut off
            marginLeft: !canScrollLeft && !isLarge ? -18 : undefined,
            paddingRight: isLarge ? '50vw' : undefined,
            paddingLeft: isLarge
              ? 'calc(50vw + 2px)'
              : !canScrollLeft
                ? 18
                : undefined,
            paddingTop: 2
          }}
          pb='3xl'
        >
          <Flex
            gap='m'
            css={{ minWidth: 'max-content', overflow: 'visible' }}
            pv='2xs'
          >
            {data
              ? data?.map((id) => <Card key={id} id={id} size='s' />)
              : Array.from({ length: 6 }).map((_, i) => (
                  // loading skeletons
                  <Card key={i} id={0} size='s' />
                ))}
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
}
