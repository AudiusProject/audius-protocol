import { useCallback, useEffect } from 'react'

import { Name } from '@audius/common/models'
import { accountSelectors } from '@audius/common/store'
import {
  Text,
  Button,
  Divider,
  Flex,
  TextLink,
  useTheme,
  IconTriangleExclamation
} from '@audius/harmony'
import {
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalTitle
} from '@audius/stems'

import { useModalState } from 'common/hooks/useModalState'
import { make, useRecord } from 'common/store/analytics/actions'
import { useSelector } from 'utils/reducer'

import { AdvancedWalletDetails } from './AdvancedWalletDetails'
import styles from './PrivateKeyExporterPage.module.css'

const getAccountUser = accountSelectors.getAccountUser

const messages = {
  privateKey: 'PRIVATE KEY',
  secure: 'Keep This Information Secure',
  yourPrivateKey:
    'Your private key should be kept confidential and stored securely.',
  audiusWillNever: 'Audius will NEVER request your private key. ',
  phishing:
    'Avoid phishing attempts and never enter your private key on suspicious websites.',
  additionalResources: 'Additional Resources',
  import: 'Import and Manage Multiple Wallets with Phantom.',
  airdropChecker: 'Solana Airdrop Checker.',
  close: 'Close'
}

const PHANTOM_IMPORT_URL =
  'https://phantom.app/learn/blog/import-and-manage-multiple-wallets-with-phantom'
const SOLANA_AIRDROP_CHECKER_URL = 'https://solana-airdrop-checker.solworks.dev'

const KeepThisInformationSecure = () => {
  const { color } = useTheme()
  const bulletPoints = [
    messages.yourPrivateKey,
    messages.audiusWillNever,
    messages.phishing
  ]
  return (
    <Flex
      direction='column'
      alignItems='flex-start'
      pv='l'
      ph='2xl'
      gap='l'
      borderRadius='m'
      border='strong'
      css={{
        background: 'rgba(208, 2, 27, 0.05)',
        borderColor: color.special.darkRed
      }}
    >
      <Flex alignItems='center' gap='s'>
        <IconTriangleExclamation size='m' fill={color.special.darkRed} />
        <Text variant='title' color='danger' css={{ fontSize: 24 }}>
          {messages.secure}
        </Text>
      </Flex>
      {bulletPoints.map((bulletPoint, i) => (
        <Text
          key={`bullet-point${i}`}
          variant='body'
          textAlign='left'
          color='danger'
          css={{
            display: 'list-item',
            listStyleType: 'disc',
            listStylePosition: 'inside'
          }}
        >
          {bulletPoint}
        </Text>
      ))}
    </Flex>
  )
}

const AdditionalResources = () => {
  const { color } = useTheme()
  return (
    <Flex direction='column'>
      <Text variant='heading' size='s'>
        {messages.additionalResources}
      </Text>
      <TextLink
        href={PHANTOM_IMPORT_URL}
        target='_blank'
        isExternal
        css={{ lineHeight: '24px', color: color.primary.p500, fontWeight: 500 }}
      >
        {messages.import}
      </TextLink>
      <TextLink
        strength='strong'
        href={SOLANA_AIRDROP_CHECKER_URL}
        target='_blank'
        isExternal
        css={{ lineHeight: '24px', color: color.primary.p500, fontWeight: 500 }}
      >
        {messages.airdropChecker}
      </TextLink>
    </Flex>
  )
}

export const PrivateKeyExporterModal = () => {
  const record = useRecord()
  const user = useSelector(getAccountUser) ?? undefined
  const [isVisible, setIsVisible] = useModalState('PrivateKeyExporter')
  const handleClose = useCallback(() => setIsVisible(false), [setIsVisible])
  useEffect(() => {
    if (isVisible && user) {
      record(
        make(Name.EXPORT_PRIVATE_KEY_MODAL_OPENED, {
          handle: user.handle,
          userId: user.user_id
        })
      )
    }
  }, [isVisible, user, record])
  return (
    <Modal
      bodyClassName={styles.modal}
      onClose={handleClose}
      isOpen={isVisible}
    >
      <ModalHeader
        onClose={handleClose}
        dismissButtonClassName={styles.modalCloseIcon}
      >
        <ModalTitle
          title={messages.privateKey}
          titleClassName={styles.modalTitle}
        />
      </ModalHeader>
      <ModalContent>
        <Flex direction='column' gap='xl'>
          <KeepThisInformationSecure />
          <AdvancedWalletDetails />
          <Divider orientation='horizontal' />
          <AdditionalResources />
        </Flex>
      </ModalContent>
      <ModalFooter>
        <Button
          variant='secondary'
          onClick={handleClose}
          css={{ marginLeft: 24, marginRight: 24 }}
          fullWidth
        >
          {messages.close}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default PrivateKeyExporterModal
