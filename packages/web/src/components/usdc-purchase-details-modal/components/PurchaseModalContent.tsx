import { useCallback } from 'react'

import { USDCPurchaseDetails } from '@audius/common/models'
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
import { DynamicTrackArtwork } from 'components/track/DynamicTrackArtwork'
import { UserNameAndBadges } from 'components/user-name-and-badges/UserNameAndBadges'
import { useGoToRoute } from 'hooks/useGoToRoute'
import { useFlag } from 'hooks/useRemoteConfig'

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
  const goToRoute = useGoToRoute()
  const { isEnabled: isPremiumAlbumsEnabled } = useFlag(
    FeatureFlags.PREMIUM_ALBUMS_ENABLED
  )

  const handleClickVisit = useCallback(() => {
    onClose()
    goToRoute(link)
  }, [onClose, link, goToRoute])

  return isPremiumAlbumsEnabled ? (
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
                textVariant='body'
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
          <DetailSection label={contentLabel}>
            <ContentLink onClick={onClose} link={link} title={contentTitle} />
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
          onClick={handleClickVisit}
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
