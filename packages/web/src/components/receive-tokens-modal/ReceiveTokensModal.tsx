import { useCallback, useContext } from 'react'

import { useWalletAddresses } from '@audius/common/api'
import { useReceiveTokensModal } from '@audius/common/store'
import {
  Button,
  Flex,
  IconError,
  Text,
  LoadingSpinner,
  Divider,
  Hint
} from '@audius/harmony'
import QRCode from 'react-qr-code'
import { useAsync } from 'react-use'

import { AddressTile } from 'components/address-tile'
import { CryptoBalanceSection } from 'components/buy-sell-modal/CryptoBalanceSection'
import { ExternalTextLink } from 'components/link'
import ResponsiveModal from 'components/modal/ResponsiveModal'
import { ToastContext } from 'components/toast/ToastContext'
import { useIsMobile } from 'hooks/useIsMobile'
import { getUserBank } from 'services/solana/solana'
import { copyToClipboard } from 'utils/clipboardUtil'

const DIMENSIONS = 160

const messages = {
  title: 'RECEIVE',
  explainer: 'Send tokens to your built in Audius wallet.',
  disclaimer: 'Use caution to avoid errors and lost funds.',
  learnMore: 'Learn More',
  copy: 'Copy Wallet Address',
  close: 'Close',
  copied: 'Copied to Clipboard!'
}

export const ReceiveTokensModal = () => {
  const { isOpen, onClose, data } = useReceiveTokensModal()
  const { data: walletAddresses } = useWalletAddresses()
  const { currentUser: wallet } = walletAddresses ?? {}
  const { toast } = useContext(ToastContext)
  const isMobile = useIsMobile()
  const { tokenInfo, balance } = data

  const { value: userBankAddress } = useAsync(async () => {
    if (wallet && tokenInfo?.name) {
      const userBankPubKey = await getUserBank(wallet, tokenInfo.name)
      return userBankPubKey?.toString()
    }
  }, [wallet, tokenInfo?.name])

  const handleCopy = useCallback(() => {
    copyToClipboard(userBankAddress ?? '')
    toast(messages.copied)
  }, [userBankAddress, toast])

  if (wallet === null) {
    return (
      <ResponsiveModal
        isOpen={isOpen}
        onClose={onClose}
        size='l'
        dismissOnClickOutside
      >
        <Flex justifyContent='center' alignItems='center' p='xl' w='100%'>
          <LoadingSpinner css={{ height: 32 }} />
        </Flex>
      </ResponsiveModal>
    )
  }

  const hint = (
    <Hint
      icon={IconError}
      actions={
        <ExternalTextLink
          to='https://support.audius.co/product/tokens'
          variant='visible'
          showUnderline
        >
          {messages.learnMore}
        </ExternalTextLink>
      }
    >
      {messages.disclaimer}
    </Hint>
  )

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      size='m'
      dismissOnClickOutside
      title={messages.title}
    >
      <Flex direction='column' gap='xl' p='xl' h='100%'>
        {tokenInfo && balance ? (
          <CryptoBalanceSection tokenInfo={tokenInfo} amount={balance} />
        ) : null}

        <Divider orientation='horizontal' color='default' />

        {/* QR Code and Instructions */}
        <Flex gap='xl' alignItems='center' row>
          <Flex
            w={DIMENSIONS}
            h={DIMENSIONS}
            alignItems='center'
            justifyContent='center'
          >
            {userBankAddress ? <QRCode value={userBankAddress} /> : null}
          </Flex>
          <Flex
            column
            gap='xl'
            h={DIMENSIONS}
            justifyContent={isMobile ? 'center' : 'space-between'}
          >
            <Text variant='body' size='l'>
              {messages.explainer}
            </Text>
            {!isMobile ? hint : null}
          </Flex>
        </Flex>

        {/* Wallet Address */}
        <AddressTile address={userBankAddress} />

        {isMobile ? hint : null}

        {/* Action Buttons */}
        <Flex
          gap='s'
          alignItems='center'
          direction={isMobile ? 'column' : 'row'}
        >
          <Button variant='primary' fullWidth onClick={handleCopy}>
            {messages.copy}
          </Button>
          {isMobile ? null : (
            <Button variant='secondary' fullWidth onClick={onClose}>
              {messages.close}
            </Button>
          )}
        </Flex>
      </Flex>
    </ResponsiveModal>
  )
}
