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
  IconCart
} from '@audius/harmony'
import moment from 'moment'

import { DynamicTrackArtwork } from 'components/track/DynamicTrackArtwork'
import { Text } from 'components/typography'
import { UserNameAndBadges } from 'components/user-name-and-badges/UserNameAndBadges'
import { useGoToRoute } from 'hooks/useGoToRoute'

import { DetailSection } from './DetailSection'
import { TrackLink } from './TrackLink'
import { TransactionSummary } from './TransactionSummary'
import styles from './styles.module.css'
import { ContentProps } from './types'

const messages = {
  by: 'By',
  date: 'Date',
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
  const goToRoute = useGoToRoute()
  const { data: track } = useGetTrackById({ id: purchaseDetails.contentId })
  const handleClickVisitTrack = useCallback(() => {
    if (track) {
      onClose()
      goToRoute(track.permalink)
    }
  }, [track, onClose, goToRoute])

  return (
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
          <Text size='large' color='secondary'>
            <UserNameAndBadges
              onNavigateAway={onClose}
              userId={purchaseDetails.sellerUserId}
            />
          </Text>
        </DetailSection>
        <DetailSection label={messages.date}>
          <Text size='large'>
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
