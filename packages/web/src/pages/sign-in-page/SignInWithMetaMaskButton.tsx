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
import { metaMask } from '@wagmi/connectors'
import { disconnect } from '@wagmi/core'
import { useDispatch } from 'react-redux'
import { useAccount, useConnect, useSwitchChain } from 'wagmi'

import { getRouteOnCompletion } from 'common/store/pages/signon/selectors'
import { useNavigateToPage } from 'hooks/useNavigateToPage'
import { doesUserExist } from 'pages/sign-up-page/components/ExternalWalletSignUpModal'
import { userHasMetaMask } from 'pages/sign-up-page/utils/metamask'
import { initSdk } from 'services/audius-sdk'
import { audiusChain, wagmiConfig } from 'services/audius-sdk/wagmi'
import { reportToSentry } from 'store/errors/reportToSentry'
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
  const { connectAsync } = useConnect()
  const { isConnected, address } = useAccount()
  const { switchChainAsync } = useSwitchChain()
  const navigate = useNavigateToPage()
  const route = useSelector(getRouteOnCompletion)
  const [status, setStatus] = useState(Status.IDLE)
  const [isNoAccountError, setIsNoAccountError] = useState(false)
  const dispatch = useDispatch()

  const handleClick = useCallback(async () => {
    try {
      setStatus(Status.LOADING)
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

      // Reinit SDK with the connected wallet
      const sdk = await initSdk({ ignoreCachedUserWallet: true })

      // Check that the user exists.
      // If they don't, disconnect and try to get them to sign up.
      const userExists = await doesUserExist(sdk, wallet)
      if (!userExists) {
        await disconnect(wagmiConfig)
        await initSdk()
        setIsNoAccountError(true)
        setStatus(Status.ERROR)
        return
      }

      // Otherwise, refetch the user account in the saga.
      dispatch(
        accountActions.fetchAccount({ shouldMarkAccountAsLoading: true })
      )
      navigate(route ?? FEED_PAGE)
    } catch (e) {
      setStatus(Status.ERROR)
      await reportToSentry({ error: e as Error })
    }
  }, [
    address,
    connectAsync,
    dispatch,
    isConnected,
    navigate,
    route,
    switchChainAsync
  ])

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
