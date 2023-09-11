import { useCallback } from 'react'

import {
  CommonState,
  USDCPurchaseDetails,
  chatActions,
  chatSelectors,
  formatUSDCWeiToUSDString,
  useGetTrackById,
  useInboxUnavailableModal,
  useUSDCPurchaseDetailsModal
} from '@audius/common'
import {
  HarmonyButton,
  HarmonyButtonType,
  IconArrow,
  IconCart,
  IconMessage,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalTitle
} from '@audius/stems'
import moment from 'moment'
import { useSelector, useDispatch } from 'react-redux'

import { Icon } from 'components/Icon'
import { Link } from 'components/link'
import { DynamicTrackArtwork } from 'components/track/DynamicTrackArtwork'
import { Text } from 'components/typography'
import { UserNameAndBadges } from 'components/user-name-and-badges/UserNameAndBadges'
import { useGoToRoute } from 'hooks/useGoToRoute'

import styles from './USDCPurchaseDetailsModal.module.css'

const { getCanCreateChat } = chatSelectors
const { createChat } = chatActions

const messages = {
  by: 'By',
  cost: 'Cost',
  date: 'Date',
  done: 'Done',
  messageBuyer: 'Message Buyer',
  purchasedBy: 'Purchased By',
  purchaseDetails: 'Purchase Details',
  saleDetails: 'Sale Details',
  track: 'Track',
  trackPurchased: 'Track Purchased',
  visitTrack: 'Visit Track'
}

type ContentProps = {
  purchaseDetails: USDCPurchaseDetails
  onClose: () => void
}

const DetailSection = ({
  children,
  label
}: {
  children: React.ReactNode
  label: string
}) => (
  <div className={styles.detailSection}>
    <Text variant='label' size='large' color='neutralLight4'>
      {label}
    </Text>
    {children}
  </div>
)

const TrackLink = ({ id, onClick }: { id: number; onClick: () => void }) => {
  const { data: track } = useGetTrackById({ id })
  if (!track) return null
  return (
    <Link onClick={onClick} className={styles.link} to={track.permalink}>
      <Text size='large' color='secondary'>
        {track.title}
      </Text>
    </Link>
  )
}

const PurchaseModalContent = ({ purchaseDetails, onClose }: ContentProps) => {
  const goToRoute = useGoToRoute()
  const { data: track } = useGetTrackById({ id: purchaseDetails.contentId })
  const onClickVisitTrack = useCallback(() => {
    if (track) {
      onClose()
      goToRoute(track.permalink)
    }
  }, [track, onClose, goToRoute])

  return (
    <>
      <ModalHeader>
        <ModalTitle
          iconClassName={styles.icon}
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
          onClick={onClickVisitTrack}
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

const SaleModalContent = ({ purchaseDetails, onClose }: ContentProps) => {
  const dispatch = useDispatch()
  const { onOpen: openInboxUnavailableModal } = useInboxUnavailableModal()

  const { canCreateChat } = useSelector((state: CommonState) =>
    getCanCreateChat(state, { userId: purchaseDetails.buyerUserId })
  )

  const onClickMessageBuyer = useCallback(() => {
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
          iconClassName={styles.icon}
          icon={<Icon icon={IconCart} />}
          title={messages.purchaseDetails}
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
          iconLeft={IconMessage}
          variant={HarmonyButtonType.GHOST}
          text={messages.messageBuyer}
          onClick={onClickMessageBuyer}
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

export const USDCPurchaseDetailsModal = () => {
  const { isOpen, data, onClose, onClosed } = useUSDCPurchaseDetailsModal()
  const { variant, purchaseDetails } = data

  if (!purchaseDetails) {
    console.error(
      `USDCPurchaseDetailsModal (${variant}) rendered with empty purchase details`
    )
    return null
  }
  return (
    <Modal isOpen={isOpen} onClose={onClose} onClosed={onClosed} size={'small'}>
      {variant === 'purchase' ? (
        <PurchaseModalContent
          purchaseDetails={purchaseDetails}
          onClose={onClose}
        />
      ) : (
        <SaleModalContent purchaseDetails={purchaseDetails} onClose={onClose} />
      )}
    </Modal>
  )
}
