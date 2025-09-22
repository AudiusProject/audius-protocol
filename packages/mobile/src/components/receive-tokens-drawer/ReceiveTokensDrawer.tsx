import { useCallback } from 'react'

import { useUserbank } from '@audius/common/hooks'
import { walletMessages } from '@audius/common/messages'
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
import { QRCodeComponent, BalanceSection } from 'app/components/core'
import { AddressTile } from 'app/components/core/AddressTile'
import Drawer from 'app/components/drawer/Drawer'
import Skeleton from 'app/components/skeleton'
import { useToast } from 'app/hooks/useToast'

import { DrawerHeader } from '../drawer/DrawerHeader'

const QR_CODE_SIZE = 160

export const ReceiveTokensDrawer = () => {
  const { isOpen, onClose, data } = useReceiveTokensModal()
  const { toast } = useToast()
  const { mint } = data ?? {}
  const { userBankAddress } = useUserbank(mint)

  const handleCopyAddress = useCallback(() => {
    if (userBankAddress) {
      Clipboard.setString(userBankAddress)
      toast({ content: 'Copied to clipboard!', type: 'info' })
    }
  }, [userBankAddress, toast])

  const renderHeader = () => {
    return (
      <Flex pv='l' ph='xl' gap='m' mb='m'>
        <DrawerHeader
          onClose={onClose}
          title={walletMessages.receiveTokensTitle}
        />
        <Divider />
      </Flex>
    )
  }

  return (
    <Drawer isOpen={isOpen} onClose={onClose} drawerHeader={renderHeader}>
      <Flex direction='column' gap='xl' ph='xl'>
        <BalanceSection mint={mint} />

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
              {walletMessages.receiveTokensExplainer}
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
              <Text color='accent'>
                {walletMessages.receiveTokensLearnMore}
              </Text>
            </TextLink>
          }
        >
          {walletMessages.receiveTokensDisclaimer}
        </Hint>

        {/* Copy Button */}
        <Button
          variant='primary'
          fullWidth
          onPress={handleCopyAddress}
          disabled={!userBankAddress}
        >
          {walletMessages.receiveTokensCopy}
        </Button>
      </Flex>
    </Drawer>
  )
}
