import { useCallback, useState } from 'react'

import {
  DownloadQuality,
  cacheTracksSelectors,
  useCurrentStems
} from '@audius/common'
import type { ID, CommonState } from '@audius/common'
import { LayoutAnimation } from 'react-native'
import { useSelector } from 'react-redux'

import { Flex, IconReceive, Text, Button } from '@audius/harmony-native'
import { SegmentedControl } from 'app/components/core'
import { Expandable, ExpandableArrowIcon } from 'app/components/expandable'

import { DownloadRow } from './DownloadRow'

const { getTrack } = cacheTracksSelectors

const ORIGINAL_TRACK_INDEX = 1
const STEM_INDEX_OFFSET_WITHOUT_ORIGINAL_TRACK = 1
const STEM_INDEX_OFFSET_WITH_ORIGINAL_TRACK = 2

const messages = {
  title: 'Stems & Downloads',
  choose: 'Choose File Quality',
  mp3: 'MP3',
  original: 'Original',
  downloadAll: 'Download All'
}

export const DownloadSection = ({ trackId }: { trackId: ID }) => {
  const [quality, setQuality] = useState(DownloadQuality.MP3)
  const [isExpanded, setIsExpanded] = useState(false)
  const { stemTracks } = useCurrentStems({ trackId })
  const track = useSelector((state: CommonState) =>
    getTrack(state, { id: trackId })
  )

  const onToggleExpand = useCallback(() => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(180, 'easeInEaseOut', 'opacity')
    )
    setIsExpanded((expanded) => !expanded)
  }, [])

  const renderHeader = () => {
    return (
      <Flex
        p='l'
        direction='row'
        justifyContent='space-between'
        alignItems='center'
      >
        <Flex direction='row' alignItems='center' gap='s'>
          <IconReceive color='default' />
          <Text variant='label' size='l' strength='strong'>
            {messages.title}
          </Text>
        </Flex>
        <ExpandableArrowIcon expanded={isExpanded} />
      </Flex>
    )
  }

  const options = [
    {
      key: DownloadQuality.MP3,
      text: messages.mp3
    },
    {
      key: DownloadQuality.ORIGINAL,
      text: messages.original
    }
  ]

  return (
    <Flex border='default' borderRadius='m' mb='m'>
      <Expandable
        renderHeader={renderHeader}
        expanded={isExpanded}
        onToggleExpand={onToggleExpand}
      >
        <Flex p='l' borderTop='default' gap='l' alignItems='flex-start'>
          <Text variant='title'>{messages.choose}</Text>
          <SegmentedControl
            options={options}
            selected={quality}
            onSelectOption={(quality) => setQuality(quality)}
          />
          <Button variant='secondary' iconLeft={IconReceive} size='small'>
            {messages.downloadAll}
          </Button>
        </Flex>
        {track?.is_downloadable ? (
          <DownloadRow
            trackId={trackId}
            quality={quality}
            index={ORIGINAL_TRACK_INDEX}
          />
        ) : null}
        {stemTracks?.map((s, i) => (
          <DownloadRow
            trackId={s.id}
            key={s.id}
            index={
              i +
              (track?.is_downloadable
                ? STEM_INDEX_OFFSET_WITH_ORIGINAL_TRACK
                : STEM_INDEX_OFFSET_WITHOUT_ORIGINAL_TRACK)
            }
            quality={quality}
          />
        ))}
      </Expandable>
    </Flex>
  )
}
