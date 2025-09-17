import { ConnectedWallet } from '@audius/common/api'
import { shortenSPLAddress } from '@audius/common/utils'
import { Flex, IconSolana, Text } from '@audius/harmony'

export const ConnectedWalletHeader = ({
  connectedWallet
}: {
  connectedWallet: ConnectedWallet
}) => {
  return (
    <Flex gap='s' alignItems='center' justifyContent='flex-end' w='100%'>
      <Text variant='body' size='m' color='subdued'>
        Connected Wallet
      </Text>
      <Flex direction='column' gap='xs' alignItems='flex-start'>
        <Flex
          backgroundColor='surface1'
          border='default'
          borderRadius='3xl'
          p='xs'
          gap='xs'
          alignItems='center'
        >
          <Flex
            w={24}
            h={24}
            borderRadius='3xl'
            backgroundColor='white'
            alignItems='center'
            justifyContent='center'
          >
            <IconSolana size='s' />
          </Flex>
          <Text variant='body' size='m' strength='strong' ellipses>
            {shortenSPLAddress(connectedWallet.address)}
          </Text>
        </Flex>
      </Flex>
    </Flex>
  )
}
