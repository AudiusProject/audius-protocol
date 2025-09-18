import { useCallback, useContext } from 'react'

import {
  useArtistCoin,
  useTokenBalance,
  transformArtistCoinToTokenInfo
} from '@audius/common/api'
import { useUserbank } from '@audius/common/hooks'
import { walletMessages } from '@audius/common/messages'
import { useReceiveTokensModal } from '@audius/common/store'
import { route } from '@audius/common/utils'
import {
  Button,
  Flex,
  IconError,
  Text,
  LoadingSpinner,
  Divider,
  Hint,
  useMedia
} from '@audius/harmony'

import { AddressTile } from 'components/address-tile'
import { CryptoBalanceSection } from 'components/buy-sell-modal/CryptoBalanceSection'
import { QRCodeComponent } from 'components/core/QRCode'
import { ExternalTextLink } from 'components/link'
import ResponsiveModal from 'components/modal/ResponsiveModal'
import { ToastContext } from 'components/toast/ToastContext'
import { copyToClipboard } from 'utils/clipboardUtil'

const DIMENSIONS = 160

export const ReceiveTokensModal = () => {
  const { isOpen, onClose, data } = useReceiveTokensModal()
  const { toast } = useContext(ToastContext)
  const { isMobile } = useMedia()
  const { mint } = data ?? {}

  const { data: coin } = useArtistCoin(mint ?? '')
  const { data: tokenBalance } = useTokenBalance({ mint: mint ?? '' })
  const { userBankAddress, wallet } = useUserbank(mint)
  const tokenInfo = coin ? transformArtistCoinToTokenInfo(coin) : undefined
  const balance = tokenBalance?.balance?.toString()

  const handleCopy = useCallback(() => {
    copyToClipboard(userBankAddress ?? '')
    toast(walletMessages.receiveTokensCopied)
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
          <LoadingSpinner h='2xl' />
        </Flex>
      </ResponsiveModal>
    )
  }

  const hint = (
    <Hint
      icon={IconError}
      actions={
        <ExternalTextLink
          to={route.AUDIUS_TOKENS_HELP_LINK}
          variant='visible'
          showUnderline
        >
          {walletMessages.receiveTokensLearnMore}
        </ExternalTextLink>
      }
    >
      {walletMessages.receiveTokensDisclaimer}
    </Hint>
  )

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      size='m'
      dismissOnClickOutside
      title={walletMessages.receiveTokensTitle}
    >
      <Flex direction='column' gap='xl' p='xl' h='100%'>
        {tokenInfo && balance ? (
          <CryptoBalanceSection tokenInfo={tokenInfo} amount={balance} />
        ) : null}

        <Divider orientation='horizontal' color='default' />

        <Flex gap='xl' alignItems='center' row>
          <Flex
            w={DIMENSIONS}
            h={DIMENSIONS}
            alignItems='center'
            justifyContent='center'
          >
            {userBankAddress ? (
              <QRCodeComponent value={userBankAddress} />
            ) : null}
          </Flex>
          <Flex column gap='xl' h={DIMENSIONS} justifyContent='center' flex={1}>
            <Text variant='body' size='l'>
              {walletMessages.receiveTokensExplainer}
            </Text>
            {!isMobile ? hint : null}
          </Flex>
        </Flex>

        {userBankAddress ? <AddressTile address={userBankAddress} /> : null}

        {isMobile ? hint : null}

        <Flex
          gap='s'
          alignItems='center'
          direction={isMobile ? 'column' : 'row'}
        >
          <Button variant='primary' fullWidth onClick={handleCopy}>
            {walletMessages.receiveTokensCopy}
          </Button>
          {isMobile ? null : (
            <Button variant='secondary' fullWidth onClick={onClose}>
              {walletMessages.receiveTokensClose}
            </Button>
          )}
        </Flex>
      </Flex>
    </ResponsiveModal>
  )
}
