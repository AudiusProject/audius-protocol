import { useCallback, useState } from 'react'

import { useCurrentStems, ID } from '@audius/common'
import {
  Flex,
  Box,
  Text,
  IconReceive,
  Button,
  ButtonType,
  ButtonSize,
  IconCaretDown
} from '@audius/harmony'
import { SegmentedControl } from '@audius/stems'

import { Icon } from 'components/Icon'
import { Expandable } from 'components/expandable/Expandable'

import { DownloadRow } from './DownloadRow'

const messages = {
  title: 'Stems & Downloads',
  choose: 'Choose File Quality',
  mp3: 'MP3',
  original: 'Original',
  downloadAll: 'Download All'
}

enum Quality {
  MP3 = 'MP3',
  ORIGINAL = 'ORIGINAL'
}

type DownloadSectionProps = {
  trackId: ID
  onDownload: (trackId: ID, category?: string, parentTrackId?: ID) => void
}

export const DownloadSection = ({
  trackId,
  onDownload
}: DownloadSectionProps) => {
  const { stemTracks } = useCurrentStems({ trackId })
  const shouldDisplayDownloadAll = stemTracks.length > 1
  const [quality, setQuality] = useState(Quality.MP3)
  const [expanded, setExpanded] = useState(false)
  const onToggleExpand = useCallback(() => setExpanded((val) => !val), [])

  const options = [
    {
      key: Quality.MP3,
      text: messages.mp3
    },
    {
      key: Quality.ORIGINAL,
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
                    variant={ButtonType.SECONDARY}
                    size={ButtonSize.SMALL}
                    iconLeft={IconReceive}
                  >
                    {messages.downloadAll}
                  </Button>
                ) : null}
              </Flex>
            </Flex>
            {stemTracks.map((s) => (
              <DownloadRow trackId={s.id} key={s.id} onDownload={onDownload} />
            ))}
            {shouldDisplayDownloadAll ? (
              <Flex borderTop='default' p='l' justifyContent='center'>
                <Button
                  variant={ButtonType.SECONDARY}
                  size={ButtonSize.SMALL}
                  iconLeft={IconReceive}
                >
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
