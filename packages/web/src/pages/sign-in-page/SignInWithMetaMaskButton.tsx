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
import { useAppKitWallet } from '@reown/appkit-wallet-button/react'
import { useDispatch } from 'react-redux'
import type { Hex } from 'viem'
import { useAccount, useSwitchChain } from 'wagmi'

import { audiusChain, appkitModal } from 'app/ReownAppKitModal'
import { getRouteOnCompletion } from 'common/store/pages/signon/selectors'
import { useNavigateToPage } from 'hooks/useNavigateToPage'
import { doesUserExist } from 'pages/sign-up-page/components/ExternalWalletSignUpModal'
import { userHasMetaMask } from 'pages/sign-up-page/utils/metamask'
import { initSdk } from 'services/audius-sdk'
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
  const { connect } = useAppKitWallet()
  const { disconnect } = useDisconnect()
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
        console.debug('Connecting to the external wallet...')
        await connect('metamask')
        const account = appkitModal.getAccount()
        if (!account || !account.isConnected || !account.address) {
          throw new Error('Account not connected')
        }
        wallet = account.address as Hex
      }
      if (!wallet) {
        throw new Error('No wallet connected')
      }

      // Ensure we're on the Audius chain
      console.debug('Switching chains...')
      await switchChainAsync({ chainId: audiusChain.id })

      // Reinit SDK with the connected wallet
      const sdk = await initSdk()

      // Check that the user exists.
      // If they don't, disconnect and try to get them to sign up.
      const userExists = await doesUserExist(sdk, wallet)
      if (!userExists) {
        console.debug('User does not exist, resetting...')
        await disconnect()
        await initSdk()
        setIsNoAccountError(true)
        setStatus(Status.ERROR)
        return
      }

      // Otherwise, refetch the user account in the saga.
      console.debug('User exists. Fetching account and signing in...')
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
    connect,
    disconnect,
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
