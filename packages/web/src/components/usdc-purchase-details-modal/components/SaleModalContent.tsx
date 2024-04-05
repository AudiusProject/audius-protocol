import { useCallback } from 'react'

import {
  chatActions,
  chatSelectors,
  useInboxUnavailableModal,
  CommonState
} from '@audius/common/store'
import { makeSolanaTransactionLink } from '@audius/common/utils'
import {
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalFooter,
  Button,
  Flex,
  IconCart,
  IconExternalLink,
  IconMessage,
  TextLink,
  Text
} from '@audius/harmony'
import moment from 'moment'
import { useDispatch, useSelector } from 'react-redux'

import {
  DynamicTrackArtwork,
  DynamicTrackArtworkSize
} from 'components/track/DynamicTrackArtwork'
import { UserNameAndBadges } from 'components/user-name-and-badges/UserNameAndBadges'

import { DetailSection } from './DetailSection'
import { TrackLink } from './TrackLink'
import { TransactionSummary } from './TransactionSummary'
import styles from './styles.module.css'
import { ContentProps } from './types'
import { useFlag } from 'hooks/useRemoteConfig'
import { FeatureFlags } from '@audius/common/services'

const { getCanCreateChat } = chatSelectors
const { createChat } = chatActions

const messages = {
  by: 'by',
  date: 'Date',
  done: 'Done',
  messageBuyer: 'Message Buyer',
  purchasedBy: 'Purchased By',
  saleDetails: 'Sale Details',
  trackPurchased: 'Track Purchased',
  transaction: 'Explore Transaction',
  transactionDate: 'Transaction Date',
  track: 'Track',
  sayThanks: 'Say Thanks'
}

export const SaleModalContent = ({
  purchaseDetails,
  onClose
}: ContentProps) => {
  const { isEnabled: isPremiumAlbumsEnabled } = useFlag(
    FeatureFlags.PREMIUM_ALBUMS_ENABLED
  )
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

  return isPremiumAlbumsEnabled ? (
    <>
      <ModalHeader>
        <ModalTitle title={messages.saleDetails} />
      </ModalHeader>
      <ModalContent className={styles.content}>
        <Flex borderBottom='default' gap='l' w='100%' pb='xl'>
          <DynamicTrackArtwork
            id={purchaseDetails.contentId}
            size={DynamicTrackArtworkSize.LARGE}
          />
          <DetailSection label={messages.track}>
            <TrackLink onClick={onClose} id={purchaseDetails.contentId} />
            <Flex gap='xs'>
              <Text variant='body' size='l'>
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
        <Flex borderBottom='default' w='100%' pb='xl'>
          <DetailSection
            label={messages.purchasedBy}
            button={
              <Button
                iconLeft={IconMessage}
                variant='secondary'
                size='small'
                onClick={handleClickMessageBuyer}
              >
                {messages.sayThanks}
              </Button>
            }
          >
            <Text variant='body' size='l' color='accent'>
              <UserNameAndBadges
                onNavigateAway={onClose}
                userId={purchaseDetails.buyerUserId}
              />
            </Text>
          </DetailSection>
        </Flex>
        <DetailSection
          label={messages.transactionDate}
          button={
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
        <ModalTitle icon={<IconCart />} title={messages.saleDetails} />
      </ModalHeader>
      <ModalContent className={styles.content}>
        <div className={styles.trackRow}>
          <DetailSection label={messages.trackPurchased}>
            <TrackLink onClick={onClose} id={purchaseDetails.contentId} />
          </DetailSection>
          <DynamicTrackArtwork id={purchaseDetails.contentId} />
        </div>
        <DetailSection label={messages.purchasedBy}>
          <Text variant='body' size='l' color='accent'>
            <UserNameAndBadges
              onNavigateAway={onClose}
              userId={purchaseDetails.buyerUserId}
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
          iconLeft={IconMessage}
          variant='secondary'
          onClick={handleClickMessageBuyer}
        >
          {messages.messageBuyer}
        </Button>
        <Button className={styles.button} onClick={onClose}>
          {messages.done}
        </Button>
      </ModalFooter>
    </>
  )
}
