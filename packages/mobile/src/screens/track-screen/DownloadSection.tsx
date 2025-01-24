import { useCallback, useState } from 'react'

import {
  useCurrentStems,
  useDownloadableContentAccess
} from '@audius/common/hooks'
import type { ID } from '@audius/common/models'
import { DownloadQuality, ModalSource } from '@audius/common/models'
import type { CommonState } from '@audius/common/store'
import {
  PurchaseableContentType,
  cacheTracksSelectors,
  usePremiumContentPurchaseModal,
  useWaitForDownloadModal
} from '@audius/common/store'
import { USDC } from '@audius/fixed-decimal'
import { css } from '@emotion/native'
import { LayoutAnimation } from 'react-native'
import { useSelector } from 'react-redux'

import {
  Button,
  Flex,
  IconLockUnlocked,
  IconReceive,
  Text,
  useTheme
} from '@audius/harmony-native'
import { Expandable, ExpandableArrowIcon } from 'app/components/expandable'
import { useToast } from 'app/hooks/useToast'
import { make, track as trackEvent } from 'app/services/analytics'
import type { AllEvents } from 'app/types/analytics'
import { EventNames } from 'app/types/analytics'

import { DownloadRow } from './DownloadRow'

const { getTrack } = cacheTracksSelectors

const ORIGINAL_TRACK_INDEX = 1
const STEM_INDEX_OFFSET_WITHOUT_ORIGINAL_TRACK = 1
const STEM_INDEX_OFFSET_WITH_ORIGINAL_TRACK = 2

const messages = {
  title: 'Stems & Downloads',
  // TODO: When upgrading react native to >0.74, we need to remove the $ here
  // and also update android to include jsc+intl
  // https://github.com/facebook/hermes/issues/23
  // https://stackoverflow.com/questions/41408025/react-native-tolocalestring-not-working-on-android
  unlockAll: (price: string) => `Unlock All $${price}`,
  purchased: 'purchased',
  followToDownload: 'Must follow artist to download.',
  purchaseableIsOwner: (price: string) =>
    `Fans can unlock & download these files for a one time purchase of ${price}`
}

export const DownloadSection = ({ trackId }: { trackId: ID }) => {
  const { color } = useTheme()
  const { toast } = useToast()
  const { onOpen: openPremiumContentPurchaseModal } =
    usePremiumContentPurchaseModal()
  const { onOpen: openWaitForDownloadModal } = useWaitForDownloadModal()
  const [isExpanded, setIsExpanded] = useState(false)
  const track = useSelector((state: CommonState) =>
    getTrack(state, { id: trackId })
  )
  const { stemTracks } = useCurrentStems({ trackId })
  const {
    price,
    shouldDisplayPremiumDownloadLocked,
    shouldDisplayPremiumDownloadUnlocked,
    shouldDisplayDownloadFollowGated,
    shouldDisplayOwnerPremiumDownloads
  } = useDownloadableContentAccess({ trackId })
  const formattedPrice = price ? USDC(price / 100).toLocaleString() : undefined
  const shouldHideDownload =
    !track?.access.download && !shouldDisplayDownloadFollowGated
  const downloadQuality = DownloadQuality.ORIGINAL

  const onToggleExpand = useCallback(() => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(180, 'easeInEaseOut', 'opacity')
    )
    setIsExpanded((expanded) => !expanded)
  }, [])

  const handlePurchasePress = useCallback(() => {
    openPremiumContentPurchaseModal(
      { contentId: trackId, contentType: PurchaseableContentType.TRACK },
      { source: ModalSource.TrackDetails }
    )
  }, [trackId, openPremiumContentPurchaseModal])

  const handleDownload = useCallback(
    ({ trackIds, parentTrackId }: { trackIds: ID[]; parentTrackId?: ID }) => {
      if (shouldDisplayDownloadFollowGated) {
        // On mobile, show a toast instead of a tooltip
        toast({ content: messages.followToDownload })
      } else if (track && track.access.download) {
        openWaitForDownloadModal({
          parentTrackId,
          trackIds,
          quality: downloadQuality
        })

        // Track download attempt event
        let event: AllEvents
        if (parentTrackId) {
          event = {
            eventName: EventNames.TRACK_DOWNLOAD_CLICKED_DOWNLOAD_ALL,
            parentTrackId,
            stemTrackIds: trackIds,
            device: 'native'
          }
        } else {
          event = {
            eventName: EventNames.TRACK_DOWNLOAD_CLICKED_DOWNLOAD_SINGLE,
            trackId: trackIds[0],
            device: 'native'
          }
        }
        trackEvent(make(event))
      }
    },
    [
      downloadQuality,
      openWaitForDownloadModal,
      shouldDisplayDownloadFollowGated,
      toast,
      track
    ]
  )

  const renderHeader = () => {
    return (
      <>
        <Flex
          p='l'
          direction='row'
          justifyContent='space-between'
          alignItems='center'
        >
          <Flex gap='m'>
            <Flex direction='row' alignItems='center' gap='s'>
              <IconReceive color='default' />
              <Text variant='label' size='l' strength='strong'>
                {messages.title}
              </Text>
            </Flex>
            {shouldDisplayPremiumDownloadLocked &&
            formattedPrice !== undefined ? (
              <Button
                variant='primary'
                size='small'
                color='lightGreen'
                onPress={handlePurchasePress}
              >
                {messages.unlockAll(formattedPrice)}
              </Button>
            ) : null}
            {shouldDisplayPremiumDownloadUnlocked ? (
              <>
                <Flex gap='s' direction='row' alignItems='center'>
                  <Flex
                    borderRadius='3xl'
                    ph='s'
                    style={css({
                      backgroundColor: color.special.lightGreen,
                      paddingTop: 1,
                      paddingBottom: 1
                    })}
                  >
                    <IconLockUnlocked color='white' size='xs' />
                  </Flex>
                  <Text
                    variant='label'
                    // TODO: size other than m causes misalignment C-3709
                    size='l'
                    strength='strong'
                    color='subdued'
                  >
                    {messages.purchased}
                  </Text>
                </Flex>
              </>
            ) : null}
          </Flex>
          <ExpandableArrowIcon expanded={isExpanded} />
        </Flex>
        {shouldDisplayOwnerPremiumDownloads && formattedPrice ? (
          <Flex pl='l' pr='l' pb='l'>
            <Text variant='body' size='m' strength='strong'>
              {messages.purchaseableIsOwner(formattedPrice)}
            </Text>
          </Flex>
        ) : null}
      </>
    )
  }

  return (
    <Flex>
      <Expandable
        renderHeader={renderHeader}
        expanded={isExpanded}
        onToggleExpand={onToggleExpand}
      >
        {track?.is_downloadable ? (
          <DownloadRow
            trackId={trackId}
            index={ORIGINAL_TRACK_INDEX}
            hideDownload={shouldHideDownload}
            onDownload={handleDownload}
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
            hideDownload={shouldHideDownload}
            onDownload={handleDownload}
          />
        ))}
      </Expandable>
    </Flex>
  )
}
