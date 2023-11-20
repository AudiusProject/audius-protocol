import { useNavigateToPage } from 'hooks/useNavigateToPage'
import { MetaMaskOption } from 'pages/sign-on/components/desktop/MetaMaskOption'
import { FEED_PAGE } from 'utils/route'

export const SignInWithMetaMaskButton = () => {
  const navigate = useNavigateToPage()

  const handleSignInWithMetaMask = async () => {
    try {
      window.localStorage.setItem('useMetaMask', JSON.stringify(true))
    } catch (err) {
      console.error(err)
    }
    navigate(FEED_PAGE)
    window.location.reload()
  }

  return (
    <MetaMaskOption text='Sign In With' onClick={handleSignInWithMetaMask} />
  )
}
