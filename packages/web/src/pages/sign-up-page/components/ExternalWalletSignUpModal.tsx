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
import { useAppKitState } from '@reown/appkit/react'
import { useAppKitWallet } from '@reown/appkit-wallet-button/react'
import { useDispatch, useSelector } from 'react-redux'
import { useSwitchChain } from 'wagmi'

import { audiusChain, modal } from 'app/ReownAppKitModal'
import { usingExternalWallet } from 'common/store/pages/signon/actions'
import { getRouteOnCompletion } from 'common/store/pages/signon/selectors'
import { useNavigateToPage } from 'hooks/useNavigateToPage'
import { usePortal } from 'hooks/usePortal'
import { initSdk } from 'services/audius-sdk'

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
  const state = useAppKitState()
  const { switchChainAsync } = useSwitchChain()
  const { connect } = useAppKitWallet()

  const navigate = useNavigateToPage()
  const dispatch = useDispatch()
  const [status, setStatus] = useState(Status.IDLE)
  const route = useSelector(getRouteOnCompletion)

  const handleConfirm = useCallback(async () => {
    setStatus(Status.LOADING)
    try {
      await connect('metamask')
      const account = modal.getAccount()
      if (!account || !account.isConnected || !account.address) {
        throw new Error('Account not connected')
      }
      const { address } = account

      console.debug('Switching chains...')
      await switchChainAsync({ chainId: audiusChain.id })

      // Reinit SDK with the connected wallet
      const sdk = await initSdk()

      console.debug('SDK reinitialized')

      // Check that the user doesn't already exist.
      // If they do, log them in.
      const userExists = await doesUserExist(sdk, address)

      console.debug('User exists?', userExists)
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
  }, [connect, dispatch, navigate, onClose, route, switchChainAsync])

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
        dismissOnClickOutside={!state.open}
      >
        <ModalHeader>
          <ModalTitle title={messages.title} />
        </ModalHeader>
        <ModalContent>
          <Flex direction='column' gap='s' alignItems='center'>
            <Text>{messages.body}</Text>
            {/* @ts-ignore */}
            {/* <appkit-button balance='hide' namespace='eip155' /> */}
          </Flex>
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
