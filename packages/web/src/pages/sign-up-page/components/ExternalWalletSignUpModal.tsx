import { useCallback, useState } from 'react'

import { Status } from '@audius/common/models'
import { FEED_PAGE, SIGN_UP_HANDLE_PAGE } from '@audius/common/src/utils/route'
import {
  accountActions,
  useExternalWalletSignUpModal
} from '@audius/common/store'
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
import type { ParsedCaipAddress } from '@reown/appkit-common'
import { useDispatch, useSelector } from 'react-redux'

import { usingExternalWallet } from 'common/store/pages/signon/actions'
import { getRouteOnCompletion } from 'common/store/pages/signon/selectors'
import { useNavigateToPage } from 'hooks/useNavigateToPage'
import { usePortal } from 'hooks/usePortal'
import { initSdk } from 'services/audius-sdk'

import { doesUserExist, useExternalWalletAuth } from './useExternalWalletAuth'

const messages = {
  title: 'Continue With External Wallet?',
  body: 'Creating an Audius account with an external wallet will negatively impact your Audius experience in a significant way. We strongly suggest creating your account with an email and password.',

  confirm: 'Yes, I Understand',
  decline: 'No, Take Me Back',

  error: 'Something went wrong. Please try again.'
}

export const ExternalWalletSignUpModal = () => {
  const { isOpen, onClose } = useExternalWalletSignUpModal()
  const navigate = useNavigateToPage()
  const dispatch = useDispatch()
  const [status, setStatus] = useState(Status.IDLE)
  const route = useSelector(getRouteOnCompletion)

  const onConnect = useCallback(
    async ({ address }: ParsedCaipAddress) => {
      const sdk = await initSdk()
      const userExists = await doesUserExist(sdk, address)
      if (userExists) {
        console.debug('User already exists. Fetching account and signing in...')
        dispatch(
          accountActions.fetchAccount({ shouldMarkAccountAsLoading: true })
        )
        navigate(route ?? FEED_PAGE)
        onClose()
        return
      }

      console.debug('User does not exist. Continuing sign up flow...')
      dispatch(usingExternalWallet())
      navigate(SIGN_UP_HANDLE_PAGE)
      onClose()
    },
    [dispatch, navigate, onClose, route]
  )

  const onError = useCallback((e: unknown) => {
    setStatus(Status.ERROR)
  }, [])

  const { connect } = useExternalWalletAuth({ onSuccess: onConnect, onError })

  const handleConfirm = useCallback(async () => {
    setStatus(Status.LOADING)
    await connect('metamask')
  }, [connect])

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
        dismissOnClickOutside={status === Status.LOADING}
      >
        <ModalHeader>
          <ModalTitle title={messages.title} />
        </ModalHeader>
        <ModalContent>
          <Flex direction='column' gap='s' alignItems='center'>
            <Text>{messages.body}</Text>
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
