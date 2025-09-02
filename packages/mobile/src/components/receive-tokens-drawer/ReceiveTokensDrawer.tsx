import { useCallback } from 'react'

import {
  useArtistCoin,
  transformArtistCoinToTokenInfo
} from '@audius/common/api'
import { useFormattedTokenBalance, useUserbank } from '@audius/common/hooks'
import { useReceiveTokensModal } from '@audius/common/store'
import { route } from '@audius/common/utils'
import Clipboard from '@react-native-clipboard/clipboard'

import {
  Button,
  Flex,
  IconError,
  Text,
  LoadingSpinner,
  Divider,
  Hint,
  TextLink
} from '@audius/harmony-native'
import { QRCodeComponent, TokenIcon } from 'app/components/core'
import { AddressTile } from 'app/components/core/AddressTile'
import Drawer from 'app/components/drawer/Drawer'
import Skeleton from 'app/components/skeleton'
import { useToast } from 'app/hooks/useToast'

import { DrawerHeader } from '../drawer/DrawerHeader'

const messages = {
  receiveTokensTitle: 'Receive',
  receiveTokensExplainer: 'Send tokens to your built in Audius wallet.',
  receiveTokensDisclaimer: 'Use caution to avoid errors and lost funds.',
  receiveTokensLearnMore: 'Learn More',
  receiveTokensCopy: 'Copy Wallet Address'
}

const QR_CODE_SIZE = 160

export const ReceiveTokensDrawer = () => {
  const { isOpen, onClose, data } = useReceiveTokensModal()
  const { toast } = useToast()
  const { mint } = data ?? {}

  const { data: coin } = useArtistCoin({ mint: mint ?? '' })
  const { tokenBalance } = useFormattedTokenBalance(mint ?? '')
  const { userBankAddress } = useUserbank(mint)

  const tokenInfo = coin ? transformArtistCoinToTokenInfo(coin) : undefined

  const handleCopyAddress = useCallback(() => {
    if (userBankAddress) {
      Clipboard.setString(userBankAddress)
      toast({ content: 'Copied to clipboard!', type: 'info' })
    }
  }, [userBankAddress, toast])

  const renderHeader = () => {
    return (
      <Flex pv='l' ph='xl' gap='m'>
        <DrawerHeader onClose={onClose} title={messages.receiveTokensTitle} />
        <Divider />
      </Flex>
    )
  }

  return (
    <Drawer isOpen={isOpen} onClose={onClose} drawerHeader={renderHeader}>
      <Flex direction='column' gap='xl' p='xl'>
        {/* Token Details Section */}
        {tokenBalance ? (
          <Flex row gap='s' alignItems='center' h='64'>
            <TokenIcon logoURI={coin?.logoUri} size={64} />
            <Flex gap='xs'>
              <Flex>
                <Text variant='heading' size='l'>
                  {tokenBalance.toLocaleString('en-US', {
                    maximumFractionDigits: 2,
                    minimumFractionDigits: 0
                  })}
                </Text>
                <Text variant='heading' size='s' color='subdued'>
                  {tokenInfo?.symbol}
                </Text>
              </Flex>
            </Flex>
          </Flex>
        ) : null}

        {/* QR Code and Explainer Section */}
        <Flex row gap='m' alignItems='center'>
          <Flex
            w={QR_CODE_SIZE}
            h={QR_CODE_SIZE}
            alignItems='center'
            justifyContent='center'
          >
            {userBankAddress ? (
              <QRCodeComponent value={userBankAddress} size={QR_CODE_SIZE} />
            ) : (
              <Flex
                alignItems='center'
                justifyContent='center'
                w={QR_CODE_SIZE}
                h={QR_CODE_SIZE}
              >
                <LoadingSpinner />
              </Flex>
            )}
          </Flex>
          <Flex gap='xl' justifyContent='center' flex={1}>
            <Text variant='body' size='l'>
              {messages.receiveTokensExplainer}
            </Text>
          </Flex>
        </Flex>

        {/* Address Tile */}
        {userBankAddress ? (
          <AddressTile address={userBankAddress} />
        ) : (
          <Skeleton height={58} />
        )}

        {/* Hint Section */}
        <Hint
          icon={IconError}
          actions={
            <TextLink url={route.AUDIUS_TOKENS_HELP_LINK}>
              <Text color='accent'>{messages.receiveTokensLearnMore}</Text>
            </TextLink>
          }
        >
          {messages.receiveTokensDisclaimer}
        </Hint>

        {/* Copy Button */}
        <Button variant='primary' fullWidth onPress={handleCopyAddress}>
          {messages.receiveTokensCopy}
        </Button>
      </Flex>
    </Drawer>
  )
}
