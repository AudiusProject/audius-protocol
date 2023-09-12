import { useCallback } from 'react'

import { useGetTrackById, formatUSDCWeiToUSDString } from '@audius/common'
import {
  ModalHeader,
  ModalTitle,
  IconCart,
  ModalContent,
  ModalFooter,
  HarmonyButton,
  HarmonyButtonType,
  IconArrow
} from '@audius/stems'
import moment from 'moment'

import { Icon } from 'components/Icon'
import { DynamicTrackArtwork } from 'components/track/DynamicTrackArtwork'
import { Text } from 'components/typography'
import { UserNameAndBadges } from 'components/user-name-and-badges/UserNameAndBadges'
import { useGoToRoute } from 'hooks/useGoToRoute'

import { DetailSection } from './DetailSection'
import { TrackLink } from './TrackLink'
import styles from './styles.module.css'
import { ContentProps } from './types'

const messages = {
  by: 'By',
  cost: 'Cost',
  date: 'Date',
  done: 'Done',
  purchaseDetails: 'Purchase Details',
  track: 'Track',
  visitTrack: 'Visit Track'
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
          icon={<Icon icon={IconCart} />}
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
            {moment(purchaseDetails.createdAt).format('M/D/YY')}
          </Text>
        </DetailSection>
        <DetailSection label={messages.cost}>
          <Text size='large'>{`$${formatUSDCWeiToUSDString(
            purchaseDetails.amount
          )}`}</Text>
        </DetailSection>
      </ModalContent>
      <ModalFooter className={styles.footer}>
        <HarmonyButton
          className={styles.button}
          variant={HarmonyButtonType.GHOST}
          text={messages.visitTrack}
          iconRight={IconArrow}
          onClick={handleClickVisitTrack}
        />
        <HarmonyButton
          className={styles.button}
          text={messages.done}
          onClick={onClose}
        />
      </ModalFooter>
    </>
  )
}
