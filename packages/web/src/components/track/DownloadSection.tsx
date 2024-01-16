import { useCallback, useState } from 'react'

import {
  useCurrentStems,
  ID,
  CommonState,
  cacheTracksSelectors,
  DownloadQuality
} from '@audius/common'
import {
  Flex,
  Box,
  Text,
  IconReceive,
  Button,
  IconCaretDown
} from '@audius/harmony'
import { SegmentedControl } from '@audius/stems'
import { shallowEqual, useSelector } from 'react-redux'

import { Icon } from 'components/Icon'
import { Expandable } from 'components/expandable/Expandable'

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

type DownloadSectionProps = {
  trackId: ID
  onDownload: (trackId: ID, category?: string, parentTrackId?: ID) => void
}

export const DownloadSection = ({
  trackId,
  onDownload
}: DownloadSectionProps) => {
  const track = useSelector(
    (state: CommonState) => getTrack(state, { id: trackId }),
    shallowEqual
  )
  const { stemTracks } = useCurrentStems({ trackId })
  const shouldDisplayDownloadAll = stemTracks.length > 1
  const [quality, setQuality] = useState(DownloadQuality.MP3)
  const [expanded, setExpanded] = useState(false)
  const onToggleExpand = useCallback(() => setExpanded((val) => !val), [])

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
    <Box border='default' borderRadius='m' css={{ overflow: 'hidden' }}>
      <Flex direction='column'>
        <Flex
          direction='row'
          justifyContent='space-between'
          alignItems='center'
          p='l'
          onClick={onToggleExpand}
          css={{
            cursor: 'pointer'
          }}
        >
          <Flex direction='row' alignItems='center' gap='s'>
            <Icon icon={IconReceive} size='large' />
            <Text variant='label' size='l' strength='strong'>
              {messages.title}
            </Text>
          </Flex>
          <IconCaretDown
            css={{
              transition: 'transform var(--harmony-expressive)',
              transform: expanded ? 'rotate(-180deg)' : undefined
            }}
            size='m'
            color='default'
          />
        </Flex>
        <Expandable expanded={expanded}>
          <Box>
            <Flex
              p='l'
              direction='row'
              justifyContent='space-between'
              alignItems='center'
              borderTop='default'
            >
              <Flex direction='row' alignItems='center' gap='l'>
                <Text variant='title'>{messages.choose}</Text>
                <SegmentedControl
                  options={options}
                  selected={quality}
                  onSelectOption={(quality) => setQuality(quality)}
                />
              </Flex>
              <Flex gap='2xl' alignItems='center'>
                <Text>size</Text>
                {shouldDisplayDownloadAll ? (
                  <Button
                    variant='secondary'
                    size='small'
                    iconLeft={IconReceive}
                  >
                    {messages.downloadAll}
                  </Button>
                ) : null}
              </Flex>
            </Flex>
            {track?.is_downloadable ? (
              <DownloadRow
                trackId={trackId}
                onDownload={onDownload}
                quality={quality}
                index={ORIGINAL_TRACK_INDEX}
              />
            ) : null}
            {stemTracks.map((s, i) => (
              <DownloadRow
                trackId={s.id}
                key={s.id}
                onDownload={onDownload}
                quality={quality}
                index={
                  i +
                  (track?.is_downloadable
                    ? STEM_INDEX_OFFSET_WITH_ORIGINAL_TRACK
                    : STEM_INDEX_OFFSET_WITHOUT_ORIGINAL_TRACK)
                }
              />
            ))}
            {/* Only display this row if original quality is not available,
            because the download all button will not be displayed at the top right. */}
            {!track?.is_original_available ? (
              <Flex borderTop='default' p='l' justifyContent='center'>
                <Button variant='secondary' size='small' iconLeft={IconReceive}>
                  {messages.downloadAll}
                </Button>
              </Flex>
            ) : null}
          </Box>
        </Expandable>
      </Flex>
    </Box>
  )
}
