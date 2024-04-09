import { useCallback } from 'react'

import {
  useGetCurrentUserId,
  useGetPlaylistById,
  useGetTrackById
} from '@audius/common/api'
import {
  SquareSizes,
  USDCContentPurchaseType,
  USDCPurchaseDetails
} from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import { makeSolanaTransactionLink } from '@audius/common/utils'
import {
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalFooter,
  Button,
  Flex,
  IconArrowRight,
  IconExternalLink,
  TextLink,
  IconCart,
  Text
} from '@audius/harmony'
import moment from 'moment'

import DynamicImage from 'components/dynamic-image/DynamicImage'
import { ExternalLink, UserLink } from 'components/link'
import {
  DynamicTrackArtwork,
  DynamicTrackArtworkSize
} from 'components/track/DynamicTrackArtwork'
import { UserNameAndBadges } from 'components/user-name-and-badges/UserNameAndBadges'
import { useCollectionCoverArt2 } from 'hooks/useCollectionCoverArt'
import { useGoToRoute } from 'hooks/useGoToRoute'
import { useFlag } from 'hooks/useRemoteConfig'
import { useTrackCoverArt2 } from 'hooks/useTrackCoverArt'

import { ContentLink } from './ContentLink'
import { DetailSection } from './DetailSection'
import { TransactionSummary } from './TransactionSummary'
import styles from './styles.module.css'

const messages = {
  by: 'by',
  date: 'Date',
  transactionDate: 'Transaction Date',
  done: 'Done',
  purchaseDetails: 'Purchase Details',
  track: 'Track',
  album: 'Album',
  visitTrack: 'Visit Track',
  visitAlbum: 'Visit Album',
  transaction: 'Explore Transaction'
}

export const PurchaseModalContent = ({
  purchaseDetails,
  onClose
}: {
  purchaseDetails: USDCPurchaseDetails
  onClose: () => void
}) => {
  const goToRoute = useGoToRoute()
  const { contentType, contentId } = purchaseDetails
  const isTrack = contentType === USDCContentPurchaseType.TRACK
  const { isEnabled: isPremiumAlbumsEnabled } = useFlag(
    FeatureFlags.PREMIUM_ALBUMS_ENABLED
  )
  const { data: currentUserId } = useGetCurrentUserId({})
  const { data: track } = useGetTrackById(
    { id: contentId },
    { disabled: !isTrack }
  )
  const { data: album } = useGetPlaylistById(
    {
      playlistId: contentId,
      currentUserId
    },
    { disabled: isTrack }
  )
  const trackArtwork = useTrackCoverArt2(contentId, SquareSizes.SIZE_150_BY_150)
  const albumArtwork = useCollectionCoverArt2(
    contentId,
    SquareSizes.SIZE_150_BY_150
  )

  const handleClickVisitTrack = useCallback(() => {
    onClose()
    if (isTrack && track) {
      goToRoute(track.permalink)
    } else if (!isTrack && album && album.permalink) {
      goToRoute(album.permalink)
    }
  }, [onClose, isTrack, track, album, goToRoute])

  return isPremiumAlbumsEnabled ? (
    <>
      <ModalHeader>
        <ModalTitle title={messages.purchaseDetails} />
      </ModalHeader>
      <ModalContent className={styles.content}>
        <Flex borderBottom='default' gap='l' w='100%' pb='xl'>
          <DynamicImage
            image={isTrack ? trackArtwork : albumArtwork}
            wrapperClassName={styles.artworkContainer}
          />
          <DetailSection label={isTrack ? messages.track : messages.album}>
            <ContentLink
              onClick={onClose}
              title={isTrack && track ? track.title : album.playlist_name}
              link={isTrack && track ? track?.permalink : album.permalink ?? ''}
            />
            <Flex gap='xs'>
              <Text variant='body' size='l'>
                {messages.by}
              </Text>
              <UserLink
                userId={purchaseDetails.sellerUserId}
                popover
                textVariant='body'
                size='l'
              />
            </Flex>
          </DetailSection>
        </Flex>
        <DetailSection
          label={messages.transactionDate}
          actionButton={
            <Button
              iconLeft={IconExternalLink}
              variant='secondary'
              size='small'
              asChild
            >
              <ExternalLink
                to={makeSolanaTransactionLink(purchaseDetails.signature)}
              >
                {messages.transaction}
              </ExternalLink>
            </Button>
          }
        >
          <Text variant='body' size='l'>
            {moment(purchaseDetails.createdAt).format('MMM DD, YYYY')}
          </Text>
        </DetailSection>
        <TransactionSummary transaction={purchaseDetails} />
      </ModalContent>
      <ModalFooter style={{ paddingTop: 0 }}>
        <Button onClick={onClose} fullWidth>
          {messages.done}
        </Button>
      </ModalFooter>
    </>
  ) : (
    <>
      <ModalHeader>
        <ModalTitle
          icon={<IconCart color='subdued' />}
          title={messages.purchaseDetails}
        />
      </ModalHeader>
      <ModalContent className={styles.content}>
        <div className={styles.trackRow}>
          <DetailSection label={messages.track}>
            <ContentLink
              onClick={onClose}
              link={track?.permalink ?? ''}
              title={track?.title ?? ''}
            />
          </DetailSection>
          <DynamicTrackArtwork
            id={purchaseDetails.contentId}
            size={DynamicTrackArtworkSize.DEFAULT}
          />
        </div>
        <DetailSection label={messages.by}>
          <Text variant='body' size='l' color='accent'>
            <UserNameAndBadges
              onNavigateAway={onClose}
              userId={purchaseDetails.sellerUserId}
            />
          </Text>
        </DetailSection>
        <DetailSection label={messages.date}>
          <Text variant='body' size='l'>
            {moment(purchaseDetails.createdAt).format('MMM DD, YYYY')}
          </Text>
        </DetailSection>
        <DetailSection
          label={
            <TextLink
              variant='subdued'
              href={makeSolanaTransactionLink(purchaseDetails.signature)}
              isExternal
              applyHoverStylesToInnerSvg
            >
              <Flex gap='xs'>
                {messages.transaction}
                <IconExternalLink size='s' color='subdued' />
              </Flex>
            </TextLink>
          }
        />
        <TransactionSummary transaction={purchaseDetails} />
      </ModalContent>
      <ModalFooter className={styles.footer}>
        <Button
          className={styles.button}
          variant='secondary'
          iconRight={IconArrowRight}
          onClick={handleClickVisitTrack}
        >
          {isTrack ? messages.visitTrack : messages.visitAlbum}
        </Button>
        <Button className={styles.button} onClick={onClose}>
          {messages.done}
        </Button>
      </ModalFooter>
    </>
  )
}
