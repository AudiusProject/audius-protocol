import { useState } from 'react'

import { Button, IconMetamask } from '@audius/harmony'

import { useNavigateToPage } from 'hooks/useNavigateToPage'
import ConnectedMetaMaskModal from 'pages/sign-up-page/components/ConnectedMetaMaskModal'
import { SIGN_UP_HANDLE_PAGE } from 'utils/route'

const messages = {
  signUpMetamask: 'Sign Up With MetaMask',
  unknownError: 'Unknown error occurred.'
}
export const SignUpWithMetaMaskButton = () => {
  const [isMetaMaskModalOpen, setIsMetaMaskModalOpen] = useState(false)
  const navigate = useNavigateToPage()
  const handleSuccess = () => {
    navigate(SIGN_UP_HANDLE_PAGE)
  }
  const handleClick = () => {
    setIsMetaMaskModalOpen(true)
  }

  return (
    <>
      <Button
        variant='secondary'
        iconRight={IconMetamask}
        isStaticIcon
        fullWidth
        onClick={handleClick}
      >
        {messages.signUpMetamask}
      </Button>
      <ConnectedMetaMaskModal
        open={isMetaMaskModalOpen}
        onBack={() => setIsMetaMaskModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </>
  )
}
