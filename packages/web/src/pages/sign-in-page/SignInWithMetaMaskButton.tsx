import { useCallback } from 'react'

import { Button, ButtonProps, IconMetamask } from '@audius/harmony'

import { useNavigateToPage } from 'hooks/useNavigateToPage'
import { userHasMetaMask } from 'pages/sign-up-page/utils/metamask'
import { FEED_PAGE } from 'utils/route'

const messages = {
  signIn: 'Sign In With MetaMask'
}

export const SignInWithMetaMaskButton = (props: ButtonProps) => {
  const navigate = useNavigateToPage()

  const handleClick = useCallback(async () => {
    try {
      window.localStorage.setItem('useMetaMask', JSON.stringify(true))
    } catch (err) {
      console.error(err)
    }
    navigate(FEED_PAGE)
    window.location.reload()
  }, [navigate])

  if (!userHasMetaMask) return null

  return (
    <Button
      variant='secondary'
      iconRight={IconMetamask}
      isStaticIcon
      onClick={handleClick}
      {...props}
    >
      {messages.signIn}
    </Button>
  )
}
