import { useCallback } from 'react'

import { Status } from '@audius/common/models'
import {
  tokenDashboardPageSelectors,
  tokenDashboardPageActions
} from '@audius/common/store'
import {
  Button,
  Flex,
  LoadingSpinner,
  ModalFooter,
  Text
} from '@audius/harmony'
import { useDispatch } from 'react-redux'

import { useSelector } from 'utils/reducer'

import WalletsTable from './WalletsTable'
const { getAssociatedWallets, getRemoveWallet } = tokenDashboardPageSelectors
const { connectNewWallet } = tokenDashboardPageActions

export const WALLET_COUNT_LIMIT = 5

const messages = {
  description:
    'Connect wallets to your account to display external $AUDIO balances and showcase NFT collectibles on your profile.',
  connect: 'Connect Wallet',
  limit: `Reached Limit of ${WALLET_COUNT_LIMIT} Connected Wallets.`,
  noConnected: 'You haven’t connected any wallets yet.',
  back: 'Back'
}

const ConnectWalletsBody = ({ onClose }: { onClose: () => void }) => {
  const dispatch = useDispatch()

  const onConnectWallets = useCallback(() => {
    dispatch(connectNewWallet())
  }, [dispatch])

  const {
    loadingStatus,
    errorMessage,
    status,
    confirmingWallet,
    connectedEthWallets: ethWallets,
    connectedSolWallets: solWallets
  } = useSelector(getAssociatedWallets)
  const removeWallets = useSelector(getRemoveWallet)
  const numConnectedWallets =
    (ethWallets?.length ?? 0) + (solWallets?.length ?? 0)
  const hasReachedLimit = numConnectedWallets >= WALLET_COUNT_LIMIT

  const isDisabled =
    removeWallets.status === 'Confirming' ||
    status === 'Connecting' ||
    status === 'Confirming'
  const isConnectDisabled = hasReachedLimit || isDisabled

  return (
    <>
      <Flex
        direction='column'
        justifyContent='center'
        alignItems='flex-start'
        pt='xl'
        ph='2xl'
        gap='l'
      >
        <Text variant='body' size='m'>
          {messages.description}
        </Text>
        {loadingStatus === Status.SUCCESS ? (
          <>
            {(numConnectedWallets > 0 || Boolean(confirmingWallet.wallet)) && (
              <WalletsTable hasActions />
            )}
            {numConnectedWallets === 0 && !confirmingWallet.wallet ? (
              <Text variant='body' size='m' strength='strong'>
                {messages.noConnected}
              </Text>
            ) : null}
          </>
        ) : loadingStatus === Status.IDLE ||
          loadingStatus === Status.LOADING ? (
          <Flex alignItems='center' alignSelf='center'>
            <LoadingSpinner />
          </Flex>
        ) : null}
        {errorMessage && (
          <Text variant='body' color='danger'>
            {errorMessage}
          </Text>
        )}
      </Flex>
      <ModalFooter>
        <Button
          onClick={onClose}
          variant='secondary'
          isLoading={false}
          fullWidth
        >
          {messages.back}
        </Button>
        <Button
          variant='primary'
          disabled={isConnectDisabled}
          onClick={onConnectWallets}
          fullWidth
        >
          {messages.connect}
        </Button>
      </ModalFooter>
    </>
  )
}

export default ConnectWalletsBody
