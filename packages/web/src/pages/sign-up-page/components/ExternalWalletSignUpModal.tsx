import { useCallback, useState } from 'react'

import { Status } from '@audius/common/models'
import { FEED_PAGE, SIGN_UP_HANDLE_PAGE } from '@audius/common/src/utils/route'
import {
  accountActions,
  useExternalWalletSignUpModal
} from '@audius/common/store'
import { isResponseError } from '@audius/common/utils'
import {
  Text,
  Flex,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  Button
} from '@audius/harmony'
import type { AudiusSdk } from '@audius/sdk'
import { metaMask } from '@wagmi/connectors'
import { useDispatch, useSelector } from 'react-redux'
import { useAccount, useConnect, useSwitchChain } from 'wagmi'

import { usingExternalWallet } from 'common/store/pages/signon/actions'
import { getRouteOnCompletion } from 'common/store/pages/signon/selectors'
import { useNavigateToPage } from 'hooks/useNavigateToPage'
import { usePortal } from 'hooks/usePortal'
import { initSdk } from 'services/audius-sdk'
import { audiusChain, wagmiConfig } from 'services/audius-sdk/wagmi'

const messages = {
  title: 'Continue With External Wallet?',
  body: 'Creating an Audius account with an external wallet will negatively impact your Audius experience in a significant way. We strongly suggest creating your account with an email and password.',

  confirm: 'Yes, I Understand',
  decline: 'No, Take Me Back',

  error: 'Something went wrong. Please try again.'
}

export const doesUserExist = async (sdk: AudiusSdk, wallet: string) => {
  try {
    const { data } = await sdk.full.users.getUserAccount({
      wallet
    })
    if (data?.user) {
      return true
    }
  } catch (e) {
    // We expect an unauthorized response for non-users
    if (!isResponseError(e) || e.response.status !== 401) {
      throw e
    }
  }
  return false
}

export const ExternalWalletSignUpModal = () => {
  const { isOpen, onClose } = useExternalWalletSignUpModal()

  const { connectAsync } = useConnect()
  const { switchChainAsync } = useSwitchChain()
  const { isConnected, address } = useAccount()
  const navigate = useNavigateToPage()
  const dispatch = useDispatch()
  const [status, setStatus] = useState(Status.IDLE)
  const route = useSelector(getRouteOnCompletion)

  const handleConfirm = useCallback(async () => {
    setStatus(Status.LOADING)
    try {
      let wallet = address
      // Ensure the wallet is connected
      if (!isConnected) {
        const connection = await connectAsync({
          chainId: audiusChain.id,
          connector: metaMask()
        })
        wallet = connection.accounts[0]
      }
      if (!wallet) {
        throw new Error('No wallet connected')
      }

      // Ensure we're on the Audius chain
      await switchChainAsync({ chainId: audiusChain.id })

      // For some reason, a delay is needed to ensure the chain ID switches.
      // I couldn't find the part of the wagmiConfig state that changes.
      // This is partially voodoo magic, a setTimeout would also work here.
      // Without this delay, new users without the network added will get a ConnectorChainMismatchError
      let unsubscribe = () => {}
      await new Promise<void>((resolve) => {
        unsubscribe = wagmiConfig.subscribe(
          (state) => state,
          () => {
            resolve()
          }
        )
      })
      unsubscribe()

      // Reinit SDK with the connected wallet
      const sdk = await initSdk()

      // Check that the user doesn't already exist.
      // If they do, log them in.
      const userExists = await doesUserExist(sdk, wallet)
      if (userExists) {
        dispatch(
          accountActions.fetchAccount({ shouldMarkAccountAsLoading: true })
        )
        navigate(route ?? FEED_PAGE)
        onClose()
        return
      }

      // Let signup saga know it's ok to go pick a handle, then go pick a handle.
      dispatch(usingExternalWallet())
      navigate(SIGN_UP_HANDLE_PAGE)
      onClose()
    } catch (e) {
      console.error(e)
      setStatus(Status.ERROR)
    }
  }, [
    address,
    connectAsync,
    dispatch,
    isConnected,
    navigate,
    onClose,
    route,
    switchChainAsync
  ])

  const onClosed = useCallback(() => {
    setStatus(Status.IDLE)
  }, [setStatus])

  const Portal = usePortal({ container: document.body })

  return (
    <Portal>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        onClosed={onClosed}
        size='medium'
      >
        <ModalHeader>
          <ModalTitle title={messages.title} />
        </ModalHeader>
        <ModalContent>
          <Text>{messages.body}</Text>
        </ModalContent>
        <ModalFooter>
          <Flex w='100%' direction='column' gap='s'>
            <Flex gap='s'>
              <Button
                fullWidth
                variant='destructive'
                onClick={handleConfirm}
                isLoading={status === Status.LOADING}
              >
                {messages.confirm}
              </Button>
              <Button
                fullWidth
                variant='secondary'
                disabled={status === Status.LOADING}
                onClick={onClose}
              >
                {messages.decline}
              </Button>
            </Flex>
            {status === Status.ERROR ? (
              <Text textAlign='center' color='danger'>
                {messages.error}
              </Text>
            ) : null}
          </Flex>
        </ModalFooter>
      </Modal>
    </Portal>
  )
}
