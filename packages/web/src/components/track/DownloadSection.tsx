import { useCallback, useState } from 'react'

import {
  useCurrentStems,
  useFileSizes,
  useDownloadableContentAccess
} from '@audius/common/hooks'
import { Name, ModalSource, DownloadQuality, ID } from '@audius/common/models'
import {
  cacheTracksSelectors,
  usePremiumContentPurchaseModal,
  CommonState,
  useWaitForDownloadModal,
  tracksSocialActions as socialTracksActions,
  toastActions
} from '@audius/common/store'
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
import { shallowEqual, useDispatch, useSelector } from 'react-redux'

import { useModalState } from 'common/hooks/useModalState'
import { TrackEvent, make } from 'common/store/analytics/actions'
import { Icon } from 'components/Icon'
import { Expandable } from 'components/expandable/Expandable'
import { audiusSdk } from 'services/audius-sdk'
import {
  useAuthenticatedCallback,
  useAuthenticatedClickCallback
} from 'hooks/useAuthenticatedCallback'
import { useIsMobile } from 'hooks/useIsMobile'

import { DownloadRow } from './DownloadRow'

const { getTrack } = cacheTracksSelectors
const { toast } = toastActions

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
  purchased: 'purchased',
  followToDownload: 'Must follow artist to download.'
}

type DownloadSectionProps = {
  trackId: ID
}

export const DownloadSection = ({ trackId }: DownloadSectionProps) => {
  const dispatch = useDispatch()
  const isMobile = useIsMobile()
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
    shouldDisplayDownloadFollowGated
  } = useDownloadableContentAccess({ trackId })
  const shouldHideDownload =
    !track?.access.download && !shouldDisplayDownloadFollowGated
  const [quality, setQuality] = useState(DownloadQuality.MP3)
  const [expanded, setExpanded] = useState(false)
  const [lockedContentModalVisibility, setLockedContentModalVisibility] =
    useModalState('LockedContent')
  const { onOpen: openPremiumContentPurchaseModal } =
    usePremiumContentPurchaseModal()
  const fileSizes = useFileSizes({ audiusSdk, trackIds: [trackId, ...stemTracks.map(s => s.id)] })
  const { onOpen: openWaitForDownloadModal } = useWaitForDownloadModal()

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

  const handleDownload = useAuthenticatedCallback(
    ({ trackIds, parentTrackId }: { trackIds: ID[]; parentTrackId?: ID }) => {
      if (isMobile && shouldDisplayDownloadFollowGated) {
        // On mobile, show a toast instead of a tooltip
        dispatch(toast({ content: messages.followToDownload }))
      } else if (track && track.access.download) {
        openWaitForDownloadModal({ contentId: parentTrackId ?? trackIds[0] })
        dispatch(
          socialTracksActions.downloadTrack({
            trackIds,
            parentTrackId,
            original: quality === DownloadQuality.ORIGINAL
          })
        )
        const trackEvent: TrackEvent = make(Name.TRACK_PAGE_DOWNLOAD, {
          id: parentTrackId ?? trackIds[0],
          parent_track_id: parentTrackId
        })
        dispatch(trackEvent)
      }
    },
    [
      dispatch,
      isMobile,
      openWaitForDownloadModal,
      quality,
      shouldDisplayDownloadFollowGated,
      track
    ]
  )

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

  const downloadAllButton = () => (
    <Button
      variant='secondary'
      size='small'
      iconLeft={IconReceive}
      onClick={() =>
        handleDownload({
          trackIds: stemTracks.map((s) => s.id),
          parentTrackId: trackId
        })
      }
      disabled={
        shouldDisplayDownloadFollowGated || shouldDisplayPremiumDownloadLocked
      }
    >
      {messages.downloadAll}
    </Button>
  )

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
            ) : null}
            {shouldDisplayPremiumDownloadUnlocked ? (
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
                    onSelectOption={(quality: DownloadQuality) =>
                      setQuality(quality)
                    }
                  />
                </Flex>
                <Flex gap='2xl' alignItems='center'>
                  {shouldDisplayDownloadAll ? downloadAllButton() : null}
                </Flex>
              </Flex>
            ) : null}
            {track?.is_downloadable ? (
              <DownloadRow
                trackId={trackId}
                onDownload={handleDownload}
                index={ORIGINAL_TRACK_INDEX}
                hideDownload={shouldHideDownload}
                size={fileSizes[trackId]}
              />
            ) : null}
            {stemTracks.map((s, i) => (
              <DownloadRow
                trackId={s.id}
                key={s.id}
                onDownload={handleDownload}
                hideDownload={shouldHideDownload}
                size={fileSizes[s.id]}
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
                {downloadAllButton()}
              </Flex>
            ) : null}
          </Box>
        </Expandable>
      </Flex>
    </Box>
  )
}
