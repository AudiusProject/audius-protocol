import { useCallback } from 'react'

import {
  CommonState,
  chatActions,
  chatSelectors,
  formatUSDCWeiToUSDString,
  useInboxUnavailableModal
} from '@audius/common'
import {
  HarmonyButton,
  HarmonyButtonType,
  IconCart,
  IconMessage,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalTitle
} from '@audius/stems'
import moment from 'moment'
import { useDispatch, useSelector } from 'react-redux'

import { Icon } from 'components/Icon'
import { DynamicTrackArtwork } from 'components/track/DynamicTrackArtwork'
import { Text } from 'components/typography'
import { UserNameAndBadges } from 'components/user-name-and-badges/UserNameAndBadges'

import { DetailSection } from './DetailSection'
import { TrackLink } from './TrackLink'
import styles from './styles.module.css'
import { ContentProps } from './types'

const { getCanCreateChat } = chatSelectors
const { createChat } = chatActions

const messages = {
  cost: 'Cost',
  date: 'Date',
  done: 'Done',
  messageBuyer: 'Message Buyer',
  purchasedBy: 'Purchased By',
  saleDetails: 'Sale Details',
  trackPurchased: 'Track Purchased'
}

export const SaleModalContent = ({
  purchaseDetails,
  onClose
}: ContentProps) => {
  const dispatch = useDispatch()
  const { onOpen: openInboxUnavailableModal } = useInboxUnavailableModal()

  const { canCreateChat } = useSelector((state: CommonState) =>
    getCanCreateChat(state, { userId: purchaseDetails.buyerUserId })
  )

  const handleClickMessageBuyer = useCallback(() => {
    onClose()
    if (canCreateChat) {
      dispatch(createChat({ userIds: [purchaseDetails.buyerUserId] }))
    } else {
      openInboxUnavailableModal({ userId: purchaseDetails.buyerUserId })
    }
  }, [
    canCreateChat,
    onClose,
    openInboxUnavailableModal,
    purchaseDetails,
    dispatch
  ])

  return (
    <>
      <ModalHeader>
        <ModalTitle
          icon={<Icon icon={IconCart} />}
          title={messages.saleDetails}
        />
      </ModalHeader>
      <ModalContent className={styles.content}>
        <div className={styles.trackRow}>
          <DetailSection label={messages.trackPurchased}>
            <TrackLink onClick={onClose} id={purchaseDetails.contentId} />
          </DetailSection>
          <DynamicTrackArtwork id={purchaseDetails.contentId} />
        </div>
        <DetailSection label={messages.purchasedBy}>
          <Text size='large' color='secondary'>
            <UserNameAndBadges
              onNavigateAway={onClose}
              userId={purchaseDetails.buyerUserId}
            />
          </Text>
        </DetailSection>
        <DetailSection label={messages.date}>
          <Text size='large'>
            {moment(purchaseDetails.createdAt).format('MMM DD, YYYY')}
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
          iconLeft={IconMessage}
          variant={HarmonyButtonType.GHOST}
          text={messages.messageBuyer}
          onClick={handleClickMessageBuyer}
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
