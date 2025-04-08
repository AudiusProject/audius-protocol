import { useCallback, useState } from 'react'

import { Status } from '@audius/common/models'
import { FEED_PAGE, SIGN_UP_EMAIL_PAGE } from '@audius/common/src/utils/route'
import { accountActions } from '@audius/common/store'
import {
  Button,
  ButtonProps,
  IconMetamask,
  Text,
  TextLink
} from '@audius/harmony'
import { useDisconnect } from '@reown/appkit/react'
import type { ParsedCaipAddress } from '@reown/appkit-common'
import { useDispatch } from 'react-redux'

import { getRouteOnCompletion } from 'common/store/pages/signon/selectors'
import { useNavigateToPage } from 'hooks/useNavigateToPage'
import {
  doesUserExist,
  useExternalWalletAuth
} from 'pages/sign-up-page/components/useExternalWalletAuth'
import { userHasMetaMask } from 'pages/sign-up-page/utils/metamask'
import { initSdk } from 'services/audius-sdk'
import { useSelector } from 'utils/reducer'

const messages = {
  signIn: 'Sign In With MetaMask',
  noAccountError: () => (
    <>
      No account found for the connected wallet. Switch wallets or{' '}
      <TextLink href={SIGN_UP_EMAIL_PAGE} variant='visible'>
        Sign Up
      </TextLink>
    </>
  ),
  error: 'Something went wrong. Please try again.'
}

export const SignInWithMetaMaskButton = (props: ButtonProps) => {
  const { disconnect } = useDisconnect()
  const navigate = useNavigateToPage()
  const route = useSelector(getRouteOnCompletion)
  const [status, setStatus] = useState(Status.IDLE)
  const [isNoAccountError, setIsNoAccountError] = useState(false)
  const dispatch = useDispatch()

  const onConnect = useCallback(
    async ({ address }: ParsedCaipAddress) => {
      const sdk = await initSdk()
      const userExists = await doesUserExist(sdk, address)
      if (!userExists) {
        console.debug('User does not exist, resetting...')
        await disconnect()
        await initSdk()
        setIsNoAccountError(true)
        setStatus(Status.ERROR)
        return
      }

      console.debug('User exists. Fetching account and signing in...')
      dispatch(
        accountActions.fetchAccount({ shouldMarkAccountAsLoading: true })
      )
      navigate(route ?? FEED_PAGE)
    },
    [disconnect, dispatch, navigate, route]
  )

  const onError = useCallback((e: unknown) => {
    setStatus(Status.ERROR)
  }, [])

  const { connect } = useExternalWalletAuth({ onSuccess: onConnect, onError })

  const handleClick = useCallback(async () => {
    setStatus(Status.LOADING)
    await connect('metamask')
  }, [connect])

  if (!userHasMetaMask) return null

  return (
    <>
      <Button
        variant='secondary'
        iconRight={IconMetamask}
        isStaticIcon
        fullWidth
        isLoading={status === Status.LOADING}
        onClick={handleClick}
        {...props}
      >
        {messages.signIn}
      </Button>
      {status === Status.ERROR ? (
        <Text color='danger'>
          {isNoAccountError ? messages.noAccountError() : messages.error}
        </Text>
      ) : null}
    </>
  )
}
