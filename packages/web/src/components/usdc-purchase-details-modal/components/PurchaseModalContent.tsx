import { USDCPurchaseDetails } from '@audius/common/models'
import { makeSolanaTransactionLink } from '@audius/common/utils'
import {
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalFooter,
  Button,
  Flex,
  IconExternalLink,
  Text
} from '@audius/harmony'
import moment from 'moment'

import DynamicImage from 'components/dynamic-image/DynamicImage'
import { ExternalLink, UserLink } from 'components/link'

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
  visitTrack: 'Visit Track',
  transaction: 'Explore Transaction'
}

type PurchaseModalContentProps = {
  purchaseDetails: USDCPurchaseDetails
  contentLabel: string
  contentTitle: string
  link: string
  artwork?: string
  onClose: () => void
}

export const PurchaseModalContent = ({
  purchaseDetails,
  contentLabel,
  contentTitle,
  link,
  artwork,
  onClose
}: PurchaseModalContentProps) => {
  return (
    <>
      <ModalHeader>
        <ModalTitle title={messages.purchaseDetails} />
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
  )
}
