import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react'

import { useToggleTrack } from '@audius/common/hooks'
import { ID, Kind, UID } from '@audius/common/models'
import { QueueSource } from '@audius/common/store'
import { makeUid } from '@audius/common/utils'
import {
  Flex,
  Text,
  IconButton,
  IconCaretLeft,
  IconCaretRight,
  useMedia
} from '@audius/harmony'

import { TrackTileSize } from 'components/track/types'
import { useIsMobile } from 'hooks/useIsMobile'

// Wrapper component to make tiles playable
const PlayableTile: React.FC<{
  id: ID
  index: number
  Tile: React.ComponentType<any>
  [key: string]: any
}> = ({ id, index, Tile, ...props }) => {
  const uid = useMemo(() => makeUid(Kind.TRACKS, id, QueueSource.EXPLORE), [id])

  const { togglePlay, isTrackPlaying } = useToggleTrack({
    id,
    uid,
    source: QueueSource.EXPLORE
  })

  // Create lineup-style togglePlay function that TrackTile expects
  const handleTogglePlay = useCallback(
    (tileUid: UID, trackId: ID) => {
      if (tileUid === uid && trackId === id) {
        togglePlay()
      }
    },
    [uid, id, togglePlay]
  )

  return (
    <Tile
      {...props}
      uid={uid}
      id={id}
      index={index}
      togglePlay={handleTogglePlay}
      isActive={isTrackPlaying}
      size={TrackTileSize.LARGE}
      statSize='large'
      ordered={false}
      hasLoaded={() => {}}
      isLoading={false}
      isTrending={false}
      isFeed={false}
    />
  )
}

type ExploreSectionProps = {
  title: string
  data?: number[]
  Card?: React.ComponentType<any>
  Tile?: React.ComponentType<any>
}
export const ExploreSection: React.FC<ExploreSectionProps> = ({
  title,
  data,
  Card,
  Tile
}) => {
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const { isLarge } = useMedia()
  const isMobile = useIsMobile()

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

  const renderTilePairs = (data: number[], Tile: React.ComponentType<any>) => {
    const pairs = []
    for (let i = 0; i < data.length; i += 2) {
      pairs.push(data.slice(i, i + 2))
    }
    return pairs.map((pair, pairIndex) => (
      <Flex
        key={pairIndex}
        direction='column'
        gap='m'
        css={{ minWidth: '532px', width: '532px' }}
      >
        {pair.map((id, idIndex) => (
          <PlayableTile
            key={id}
            id={id}
            index={pairIndex * 2 + idIndex}
            Tile={Tile}
            size='l'
            variant={TrackTileSize.LARGE}
          />
        ))}
      </Flex>
    ))
  }

  const renderTileSkeletons = (Tile: React.ComponentType<any>) => {
    return Array.from({ length: 2 }).map((_, i) => (
      <Flex
        key={i}
        direction='column'
        gap='m'
        css={{ minWidth: '532px', width: '532px' }}
      >
        <Tile key={`${i}-0`} id={0} size='m' />
        <Tile key={`${i}-1`} id={0} size='m' />
      </Flex>
    ))
  }

  return (
    <Flex direction='column' gap='l' w='100%'>
      <Flex
        gap='m'
        alignItems='center'
        alignSelf='stretch'
        justifyContent='space-between'
        ph={isMobile ? 'l' : undefined}
      >
        <Text variant='title' size='l'>
          {title}
        </Text>
        {!isMobile && (canScrollLeft || canScrollRight) ? (
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
            paddingRight: isMobile
              ? 'calc(50vw + 16px)'
              : isLarge
                ? '50vw'
                : undefined,
            paddingLeft: isMobile
              ? 'calc(50vw + 16px)'
              : isLarge
                ? 'calc(50vw + 2px)'
                : !canScrollLeft
                  ? 18
                  : undefined,
            paddingTop: 2
          }}
          pb={isMobile ? '2xl' : '3xl'}
        >
          <Flex
            gap='m'
            css={{ minWidth: 'max-content', overflow: 'visible' }}
            pv='2xs'
          >
            {Tile && !Card
              ? data
                ? renderTilePairs(data, Tile)
                : renderTileSkeletons(Tile)
              : null}
            {Card
              ? data
                ? data?.map((id) => <Card key={id} id={id} size='s' />)
                : Array.from({ length: 6 }).map((_, i) => (
                    // loading skeletons
                    <Card key={i} id={0} size={isMobile ? 'xs' : 's'} />
                  ))
              : null}
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
}
