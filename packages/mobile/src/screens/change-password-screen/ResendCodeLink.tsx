import { isOtpMissingError } from '@audius/common/hooks'
import { useField } from 'formik'
import { useAsyncFn } from 'react-use'

import { TextLink } from '@audius/harmony-native'
import { useToast } from 'app/hooks/useToast'
import { authService } from 'app/services/sdk/auth'
import { identityService } from 'app/services/sdk/identity'

const messages = {
  resend: 'Resend code.',
  resentToast: 'Verification code resent.',
  somethingWrong: 'Something went wrong.'
}

export const ResendCodeLink = () => {
  const [{ value: email }] = useField('email')

  const { toast } = useToast()

  const [{ loading }, sendCode] = useAsyncFn(async () => {
    // Try to confirm without OTP to force OTP refresh
    try {
      const wallet = authService.getWallet()
      await identityService.changeEmail({
        email,
        wallet
      })
    } catch (e) {
      if (isOtpMissingError(e)) {
        toast({ content: messages.resentToast, type: 'info' })
      } else {
        toast({ content: messages.somethingWrong, type: 'error' })
      }
    }
  }, [email, toast])
  return (
    <TextLink variant='visible' disabled={loading} onPress={sendCode}>
      {messages.resend}
    </TextLink>
  )
}
