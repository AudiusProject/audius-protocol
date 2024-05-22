import { useCallback } from 'react'

import { USDCPurchaseDetails } from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
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

import DynamicImage from 'components/dynamic-image/DynamicImage'
import { ExternalLink, UserLink } from 'components/link'
import { DynamicTrackArtwork } from 'components/track/DynamicTrackArtwork'
import { UserNameAndBadges } from 'components/user-name-and-badges/UserNameAndBadges'
import { useFlag } from 'hooks/useRemoteConfig'

import { ContentLink } from './ContentLink'
import { DetailSection } from './DetailSection'
import { TransactionSummary } from './TransactionSummary'
import styles from './styles.module.css'

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
  sayThanks: 'Say Thanks'
}

type SaleModalContentProps = {
  purchaseDetails: USDCPurchaseDetails
  contentLabel: string
  contentTitle: string
  link: string
  artwork?: string
  onClose: () => void
}

export const SaleModalContent = ({
  purchaseDetails,
  contentLabel,
  contentTitle,
  link,
  artwork,
  onClose
}: SaleModalContentProps) => {
  const dispatch = useDispatch()
  const { isEnabled: isPremiumAlbumsEnabled } = useFlag(
    FeatureFlags.PREMIUM_ALBUMS_ENABLED
  )

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
          <DynamicImage
            image={artwork}
            wrapperClassName={styles.artworkContainer}
          />
          <DetailSection label={contentLabel}>
            <ContentLink onClick={onClose} title={contentTitle} link={link} />
            <Flex gap='xs'>
              <Text variant='body' size='l'>
                {messages.by}
              </Text>
              <UserLink
                userId={purchaseDetails.sellerUserId}
                popover
                size='l'
                onClick={onClose}
              />
            </Flex>
          </DetailSection>
        </Flex>
        <Flex borderBottom='default' w='100%' pb='xl'>
          <DetailSection
            label={messages.purchasedBy}
            actionButton={
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
            <UserLink userId={purchaseDetails.buyerUserId} popover size='l' />
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
        <ModalTitle icon={<IconCart />} title={messages.saleDetails} />
      </ModalHeader>
      <ModalContent className={styles.content}>
        <div className={styles.trackRow}>
          <DetailSection label={messages.trackPurchased}>
            <ContentLink onClick={onClose} title={contentTitle} link={link} />
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
