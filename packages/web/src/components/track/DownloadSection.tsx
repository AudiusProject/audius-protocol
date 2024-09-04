import { useCallback, useState } from 'react'

import {
  useCurrentStems,
  useFileSizes,
  useDownloadableContentAccess,
  useUploadingStems
} from '@audius/common/hooks'
import {
  Name,
  ModalSource,
  DownloadQuality,
  ID,
  StemCategory
} from '@audius/common/models'
import {
  cacheTracksSelectors,
  usePremiumContentPurchaseModal,
  CommonState,
  useWaitForDownloadModal,
  toastActions,
  PurchaseableContentType
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
import { shallowEqual, useDispatch, useSelector } from 'react-redux'

import { useModalState } from 'common/hooks/useModalState'
import { make, useRecord } from 'common/store/analytics/actions'
import { Expandable } from 'components/expandable/Expandable'
import {
  useAuthenticatedCallback,
  useAuthenticatedClickCallback
} from 'hooks/useAuthenticatedCallback'
import { useIsMobile } from 'hooks/useIsMobile'
import { audiusSdk } from 'services/audius-sdk'

import { DownloadRow } from './DownloadRow'

const { getTrack } = cacheTracksSelectors
const { toast } = toastActions

const ORIGINAL_TRACK_INDEX = 1
const STEM_INDEX_OFFSET_WITHOUT_ORIGINAL_TRACK = 1
const STEM_INDEX_OFFSET_WITH_ORIGINAL_TRACK = 2

const messages = {
  title: 'Stems & Downloads',
  unlockAll: (price: string) => `Unlock All ${price}`,
  purchased: 'purchased',
  followToDownload: 'Must follow artist to download.',
  purchaseableIsOwner: (price: string) =>
    `Fans can unlock & download these files for a one time purchase of ${price}`
}

type DownloadSectionProps = {
  trackId: ID
}

export const DownloadSection = ({ trackId }: DownloadSectionProps) => {
  const dispatch = useDispatch()
  const record = useRecord()
  const isMobile = useIsMobile()
  const track = useSelector(
    (state: CommonState) => getTrack(state, { id: trackId }),
    shallowEqual
  )
  const { stemTracks } = useCurrentStems({ trackId })
  const { uploadingTracks: uploadingStems } = useUploadingStems({ trackId })
  const {
    price,
    shouldDisplayPremiumDownloadLocked,
    shouldDisplayPremiumDownloadUnlocked,
    shouldDisplayDownloadFollowGated,
    shouldDisplayOwnerPremiumDownloads
  } = useDownloadableContentAccess({ trackId })

  const downloadQuality = DownloadQuality.ORIGINAL
  const shouldHideDownload =
    !track?.access.download && !shouldDisplayDownloadFollowGated
  const formattedPrice = price ? USDC(price / 100).toLocaleString() : undefined
  const [expanded, setExpanded] = useState(false)
  const [lockedContentModalVisibility, setLockedContentModalVisibility] =
    useModalState('LockedContent')
  const { onOpen: openPremiumContentPurchaseModal } =
    usePremiumContentPurchaseModal()
  const fileSizes = useFileSizes({
    audiusSdk,
    trackIds: [trackId, ...stemTracks.map((s) => s.id)],
    downloadQuality
  })
  const { onOpen: openWaitForDownloadModal } = useWaitForDownloadModal()

  const onToggleExpand = useCallback(() => setExpanded((val) => !val), [])

  const handlePurchaseClick = useAuthenticatedClickCallback((_event) => {
    if (lockedContentModalVisibility) {
      setLockedContentModalVisibility(false)
    }
    openPremiumContentPurchaseModal(
      { contentId: trackId, contentType: PurchaseableContentType.TRACK },
      { source: ModalSource.TrackDetails }
    )
  }, [])

  const handleDownload = useAuthenticatedCallback(
    ({ trackIds, parentTrackId }: { trackIds: ID[]; parentTrackId?: ID }) => {
      if (isMobile && shouldDisplayDownloadFollowGated) {
        // On mobile, show a toast instead of a tooltip
        dispatch(toast({ content: messages.followToDownload }))
      } else if (track && track.access.download) {
        openWaitForDownloadModal({
          parentTrackId,
          trackIds,
          quality: downloadQuality
        })

        // Track download attempt event
        if (parentTrackId) {
          record(
            make(Name.TRACK_DOWNLOAD_CLICKED_DOWNLOAD_ALL, {
              parentTrackId,
              stemTrackIds: trackIds,
              device: 'web'
            })
          )
        } else {
          record(
            make(Name.TRACK_DOWNLOAD_CLICKED_DOWNLOAD_SINGLE, {
              trackId: trackIds[0],
              device: 'web'
            })
          )
        }
      }
    },
    [
      dispatch,
      downloadQuality,
      isMobile,
      openWaitForDownloadModal,
      record,
      shouldDisplayDownloadFollowGated,
      track
    ]
  )

  return (
    <Box border='default' borderRadius='m' css={{ overflow: 'hidden' }}>
      <Flex direction='column'>
        <Flex
          gap='m'
          direction='row'
          justifyContent='space-between'
          alignItems='center'
          p='l'
          onClick={onToggleExpand}
          css={{
            cursor: 'pointer'
          }}
          role='button'
          aria-expanded={expanded}
          aria-controls='download-section'
        >
          <Flex
            justifyContent='space-between'
            wrap='wrap'
            gap='m'
            css={{ flexGrow: 1 }}
          >
            <Flex direction='row' alignItems='center' gap='s'>
              <IconReceive size='l' color='default' />
              <Text variant='label' size='l' strength='strong'>
                {messages.title}
              </Text>
            </Flex>
            <Flex gap='l' alignItems='center'>
              {shouldDisplayPremiumDownloadLocked &&
              formattedPrice !== undefined ? (
                <Button
                  variant='primary'
                  size='small'
                  color='lightGreen'
                  onClick={handlePurchaseClick}
                >
                  {messages.unlockAll(formattedPrice)}
                </Button>
              ) : null}
              {shouldDisplayPremiumDownloadUnlocked ? (
                <Flex gap='s'>
                  <Flex
                    borderRadius='3xl'
                    ph='s'
                    css={{
                      backgroundColor: 'var(--harmony-light-green)',
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
            </Flex>
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
        {shouldDisplayOwnerPremiumDownloads && formattedPrice ? (
          <Flex pl='l' pr='l' pb='l'>
            <Text variant='body' size='m' strength='strong'>
              {messages.purchaseableIsOwner(formattedPrice)}
            </Text>
          </Flex>
        ) : null}
        <Expandable expanded={expanded} id='downloads-section'>
          <Box>
            {track?.is_downloadable ? (
              <DownloadRow
                trackId={trackId}
                parentTrackId={trackId}
                onDownload={handleDownload}
                index={ORIGINAL_TRACK_INDEX}
                hideDownload={shouldHideDownload}
                size={fileSizes[trackId]?.[downloadQuality]}
              />
            ) : null}
            {stemTracks.map((s, i) => (
              <DownloadRow
                trackId={s.id}
                parentTrackId={trackId}
                key={s.id}
                onDownload={handleDownload}
                hideDownload={shouldHideDownload}
                size={fileSizes[s.id]?.[downloadQuality]}
                index={
                  i +
                  (track?.is_downloadable
                    ? STEM_INDEX_OFFSET_WITH_ORIGINAL_TRACK
                    : STEM_INDEX_OFFSET_WITHOUT_ORIGINAL_TRACK)
                }
              />
            ))}
            {uploadingStems.map((s, i) => (
              <DownloadRow
                key={`uploading-stem-${i}`}
                onDownload={() => {}}
                hideDownload={shouldHideDownload}
                size={s.size}
                index={
                  i +
                  stemTracks.length +
                  (track?.is_downloadable
                    ? STEM_INDEX_OFFSET_WITH_ORIGINAL_TRACK
                    : STEM_INDEX_OFFSET_WITHOUT_ORIGINAL_TRACK)
                }
                category={s.category ?? StemCategory.OTHER}
                filename={s.name}
                isLoading
              />
            ))}
          </Box>
        </Expandable>
      </Flex>
    </Box>
  )
}
