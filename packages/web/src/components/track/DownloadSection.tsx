import { useCallback, useState } from 'react'

import {
  useCurrentStems,
  ID,
  CommonState,
  cacheTracksSelectors,
  DownloadQuality,
  useDownloadableContentAccess,
  usePremiumContentPurchaseModal,
  ModalSource
} from '@audius/common'
import { USDC } from '@audius/fixed-decimal'
import {
  Flex,
  Box,
  Text,
  IconReceive,
  Button,
  IconCaretDown,
  IconLockUnlocked
} from '@audius/harmony'
import { SegmentedControl } from '@audius/stems'
import { shallowEqual, useSelector } from 'react-redux'

import { useModalState } from 'common/hooks/useModalState'
import { Icon } from 'components/Icon'
import { Expandable } from 'components/expandable/Expandable'
import { useAuthenticatedClickCallback } from 'hooks/useAuthenticatedCallback'

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
  downloadAll: 'Download All',
  unlockAll: (price: string) => `Unlock All $${price}`,
  purchased: 'purchased'
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
  const {
    price,
    shouldDisplayPremiumDownloadLocked,
    shouldDisplayPremiumDownloadUnlocked,
    shouldDisplayFollowGatedDownloadLocked
  } = useDownloadableContentAccess({ trackId })
  const [quality, setQuality] = useState(DownloadQuality.MP3)
  const [expanded, setExpanded] = useState(false)
  const [lockedContentModalVisibility, setLockedContentModalVisibility] =
    useModalState('LockedContent')
  const { onOpen: openPremiumContentPurchaseModal } =
    usePremiumContentPurchaseModal()

  const onToggleExpand = useCallback(() => setExpanded((val) => !val), [])

  const handlePurchaseClick = useAuthenticatedClickCallback((event) => {
    if (lockedContentModalVisibility) {
      setLockedContentModalVisibility(false)
    }
    openPremiumContentPurchaseModal(
      { contentId: trackId },
      { source: ModalSource.TrackDetails }
    )
  }, [])

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
          <Flex gap='l' alignItems='center'>
            {shouldDisplayPremiumDownloadLocked && price !== undefined ? (
              <Button
                variant='primary'
                size='small'
                color='lightGreen'
                onClick={handlePurchaseClick}
              >
                {messages.unlockAll(
                  USDC(price / 100).toLocaleString('en-us', {
                    roundingMode: 'floor',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })
                )}
              </Button>
            ) : shouldDisplayPremiumDownloadUnlocked ? (
              <Flex gap='s'>
                <Flex
                  borderRadius='3xl'
                  ph='s'
                  css={{
                    backgroundColor: 'var(--special-light-green)',
                    paddingTop: '1px',
                    paddingBottom: '1px'
                  }}
                >
                  <IconLockUnlocked color='staticWhite' size='xs' />
                </Flex>
                <Text
                  variant='label'
                  size='l'
                  strength='strong'
                  color='subdued'
                >
                  {messages.purchased}
                </Text>
              </Flex>
            ) : null}
            <IconCaretDown
              css={{
                transition: 'transform var(--harmony-expressive)',
                transform: expanded ? 'rotate(-180deg)' : undefined
              }}
              size='m'
              color='default'
            />
          </Flex>
        </Flex>
        <Expandable expanded={expanded}>
          <Box>
            {track?.is_original_available ? (
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
            ) : null}
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
            {!track?.is_original_available && shouldDisplayDownloadAll ? (
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
