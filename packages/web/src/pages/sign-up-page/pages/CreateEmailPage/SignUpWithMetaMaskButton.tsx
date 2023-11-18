import { Suspense, useContext, useState } from 'react'

import { AudiusQueryContext, signUpFetch } from '@audius/common'
import { useFormikContext } from 'formik'
import { createPortal } from 'react-dom'
import { useDispatch } from 'react-redux'

import { setValueField } from 'common/store/pages/signon/actions'
import { useNavigateToPage } from 'hooks/useNavigateToPage'
import { MetaMaskOption } from 'pages/sign-on/components/desktop/MetaMaskOption'
import lazyWithPreload from 'utils/lazyWithPreload'
import { SIGN_IN_PAGE, SIGN_UP_HANDLE_PAGE } from 'utils/route'

import { SignUpEmailValues } from './CreateEmailPage'
import { messages } from './messages'

const ConnectedMetaMaskModal = lazyWithPreload(
  () => import('pages/sign-up-page/components/ConnectedMetaMaskModal'),
  0
)

export const SignUpWithMetaMaskButton = () => {
  const queryContext = useContext(AudiusQueryContext)
  const dispatch = useDispatch()
  const [isMetaMaskModalOpen, setIsMetaMaskModalOpen] = useState(false)
  const { setErrors, validateForm, values } =
    useFormikContext<SignUpEmailValues>()
  const navigate = useNavigateToPage()
  const handleSuccess = () => {
    navigate(SIGN_UP_HANDLE_PAGE)
  }
  const handleClickMetaMask = async () => {
    const errors = await validateForm(values)
    if (errors.email) {
      return false
    }

    const { email } = values
    if (queryContext !== null) {
      try {
        // Check identity API for existing emails
        const emailExists = await signUpFetch.isEmailInUse(
          { email },
          queryContext
        )
        // Set the email in the store
        dispatch(setValueField('email', values.email))
        if (emailExists) {
          // Redirect to sign in if the email exists already
          navigate(SIGN_IN_PAGE)
        } else {
          setIsMetaMaskModalOpen(true)
        }
      } catch (e) {
        setErrors({ email: messages.unknownError })
      }
    }
  }

  return (
    <>
      <MetaMaskOption fullWidth onClick={handleClickMetaMask} />
      <Suspense fallback={null}>
        {createPortal(
          <ConnectedMetaMaskModal
            open={isMetaMaskModalOpen}
            onBack={() => setIsMetaMaskModalOpen(false)}
            onSuccess={handleSuccess}
          />,
          document.body
        )}
      </Suspense>
    </>
  )
}
