import { useCallback } from 'react'

import { useGetTrackById } from '@audius/common/api'
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

import {
  DynamicTrackArtwork,
  DynamicTrackArtworkSize
} from 'components/track/DynamicTrackArtwork'
import { UserNameAndBadges } from 'components/user-name-and-badges/UserNameAndBadges'
import { useGoToRoute } from 'hooks/useGoToRoute'

import { DetailSection } from './DetailSection'
import { TrackLink } from './TrackLink'
import { TransactionSummary } from './TransactionSummary'
import styles from './styles.module.css'
import { ContentProps } from './types'
import { useFlag } from 'hooks/useRemoteConfig'
import { FeatureFlags } from '@audius/common/services'

const messages = {
  by: 'By',
  date: 'Date',
  transactionDate: 'Transaction Date',
  done: 'Done',
  purchaseDetails: 'Purchase Details',
  track: 'Track',
  visitTrack: 'Visit Track',
  transaction: 'Explore Transaction'
}

export const PurchaseModalContent = ({
  purchaseDetails,
  onClose
}: ContentProps) => {
  const { isEnabled: isPremiumAlbumsEnabled } = useFlag(
    FeatureFlags.PREMIUM_ALBUMS_ENABLED
  )
  const goToRoute = useGoToRoute()
  const { data: track } = useGetTrackById({ id: purchaseDetails.contentId })
  const handleClickVisitTrack = useCallback(() => {
    if (track) {
      onClose()
      goToRoute(track.permalink)
    }
  }, [track, onClose, goToRoute])

  return isPremiumAlbumsEnabled ? (
    <>
      <ModalHeader>
        <ModalTitle title={messages.purchaseDetails} />
      </ModalHeader>
      <ModalContent className={styles.content}>
        <Flex gap='xl' direction='column' w='100%'>
          <Flex
            borderBottom='default'
            gap='l'
            justifyContent='spaceBetween'
            w='100%'
            pb='xl'
          >
            <DynamicTrackArtwork
              id={purchaseDetails.contentId}
              size={DynamicTrackArtworkSize.LARGE}
            />
            <DetailSection label={messages.track}>
              <TrackLink onClick={onClose} id={purchaseDetails.contentId} />
              <Flex gap='xs'>
                <Text variant='body' size='l' textTransform='lowercase'>
                  {messages.by}
                </Text>
                <Text variant='body' size='l' color='accent'>
                  <UserNameAndBadges
                    onNavigateAway={onClose}
                    userId={purchaseDetails.sellerUserId}
                  />
                </Text>
              </Flex>
            </DetailSection>
          </Flex>
          <Flex justifyContent='space-between' w='100%'>
            <Flex gap='s' direction='column'>
              <Text variant='label'>{messages.transactionDate}</Text>
              <Text variant='body' size='l'>
                {moment(purchaseDetails.createdAt).format('MMM DD, YYYY')}
              </Text>
            </Flex>
            <Button
              iconLeft={IconExternalLink}
              variant='secondary'
              size='small'
              asChild
            >
              <a href={makeSolanaTransactionLink(purchaseDetails.signature)}>
                {messages.transaction}
              </a>
            </Button>
          </Flex>
          <TransactionSummary transaction={purchaseDetails} />
        </Flex>
      </ModalContent>
      <ModalFooter className={styles.footer}>
        <Button className={styles.button} onClick={onClose}>
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
            <TrackLink onClick={onClose} id={purchaseDetails.contentId} />
          </DetailSection>
          <DynamicTrackArtwork id={purchaseDetails.contentId} />
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
          {messages.visitTrack}
        </Button>
        <Button className={styles.button} onClick={onClose}>
          {messages.done}
        </Button>
      </ModalFooter>
    </>
  )
}
