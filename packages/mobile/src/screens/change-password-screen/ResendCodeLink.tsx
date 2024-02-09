import { useState, useCallback } from 'react'

import { isOtpMissingError } from '@audius/common/hooks'
import { useField } from 'formik'

import { TextLink } from '@audius/harmony-native'
import { useToast } from 'app/hooks/useToast'
import { audiusBackendInstance } from 'app/services/audius-backend-instance'

const messages = {
  resend: 'Resend code.',
  resentToast: 'Verification code resent.',
  somethingWrong: 'Something went wrong.'
}

export const ResendCodeLink = () => {
  const [{ value: email }] = useField('email')

  const [isSending, setIsSending] = useState(false)
  const { toast } = useToast()

  const handlePress = useCallback(async () => {
    setIsSending(true)
    const libs = await audiusBackendInstance.getAudiusLibsTyped()
    // Try to confirm without OTP to force OTP refresh
    try {
      await libs.identityService?.changeEmail({
        email
      })
    } catch (e) {
      if (isOtpMissingError(e)) {
        toast({ content: messages.resentToast, type: 'info' })
      } else {
        toast({ content: messages.somethingWrong, type: 'error' })
      }
    } finally {
      setIsSending(false)
    }
  }, [email, toast])
  return (
    <TextLink variant='visible' disabled={isSending} onPress={handlePress}>
      {messages.resend}
    </TextLink>
  )
}
