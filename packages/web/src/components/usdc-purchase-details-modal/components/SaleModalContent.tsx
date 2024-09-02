import { useCallback } from 'react'

import { useIsManagedAccount } from '@audius/common/hooks'
import { USDCPurchaseDetails } from '@audius/common/models'
import {
  chatSelectors,
  chatActions,
  useInboxUnavailableModal,
  type CommonState
} from '@audius/common/store'
import {
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalFooter,
  Button,
  Text,
  Flex,
  IconMessage
} from '@audius/harmony'
import moment from 'moment'
import { useDispatch, useSelector } from 'react-redux'

import DynamicImage from 'components/dynamic-image/DynamicImage'
import { UserLink } from 'components/link'

import { ContentLink } from './ContentLink'
import { DetailSection } from './DetailSection'
import { TransactionSummary } from './TransactionSummary'
import styles from './styles.module.css'

const { getCanCreateChat } = chatSelectors
const { createChat } = chatActions

const messages = {
  by: 'Purchased By',
  transactionDate: 'Date',
  done: 'Done',
  saleDetails: 'Sale Details',
  messageBuyer: 'Message Buyer',
  transaction: 'Explore Transaction'
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
  const isManagedAccount = useIsManagedAccount()

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
        <ModalTitle title={messages.saleDetails} />
      </ModalHeader>
      <ModalContent>
        <Flex gap='l' direction='column'>
          <DetailSection
            label={contentLabel}
            actionButton={
              <DynamicImage
                image={artwork}
                wrapperClassName={styles.artworkContainer}
              />
            }
          >
            <ContentLink
              variant='visible'
              onClick={onClose}
              title={contentTitle}
              link={link}
            />
          </DetailSection>
          <DetailSection label={messages.by}>
            <UserLink
              variant='visible'
              userId={purchaseDetails.buyerUserId}
              popover
              size='l'
              onClick={onClose}
            />
          </DetailSection>
          <DetailSection label={messages.transactionDate}>
            <Text variant='body' size='l'>
              {moment(purchaseDetails.createdAt).format('MMM DD, YYYY')}
            </Text>
          </DetailSection>
          <TransactionSummary isSale transaction={purchaseDetails} />
        </Flex>
      </ModalContent>
      <ModalFooter style={{ paddingTop: 0 }}>
        <Flex w='100%' gap='s'>
          {!isManagedAccount ? (
            <Button
              onClick={handleClickMessageBuyer}
              fullWidth
              variant='secondary'
              iconLeft={IconMessage}
            >
              {messages.messageBuyer}
            </Button>
          ) : null}
          <Button onClick={onClose} fullWidth>
            {messages.done}
          </Button>
        </Flex>
      </ModalFooter>
    </>
  )
}
