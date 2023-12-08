import { useCallback, useContext } from 'react'

import { socialMediaMessages } from '@audius/common'
import { TextLink } from '@audius/harmony'
import { useField } from 'formik'

import {
  HarmonyTextField,
  HarmonyTextFieldProps
} from 'components/form-fields/HarmonyTextField'
import { ToastContext } from 'components/toast/ToastContext'

import { errorMessages } from '../utils/handleSchema'

import { SignupFlowInstagramAuth } from './SignupFlowInstagramAuth'
import { SignupFlowTikTokAuth } from './SignupFlowTikTokAuth'
import { SignupFlowTwitterAuth } from './SignupFlowTwitterAuth'

const messages = {
  handle: 'Handle',
  linkToClaim: 'Link to claim.'
}

const handleAuthMap = {
  [errorMessages.twitterReservedError]: SignupFlowTwitterAuth,
  [errorMessages.instagramReservedError]: SignupFlowInstagramAuth,
  [errorMessages.tiktokReservedError]: SignupFlowTikTokAuth
}

type HandleFieldProps = Partial<HarmonyTextFieldProps> & {
  onCompleteSocialMediaLogin?: (info: {
    requiresReview: boolean
    handle: string
    platform: 'twitter' | 'instagram' | 'tiktok'
  }) => void
}

export const HandleField = (props: HandleFieldProps) => {
  const { onCompleteSocialMediaLogin, ...other } = props
  const [{ value: handle }, { error }, { setError }] = useField('handle')

  const { toast } = useContext(ToastContext)

  const handleVerifyHandleError = useCallback(() => {
    setError(socialMediaMessages.verificationError)
  }, [setError])

  const handleLoginSuccess = useCallback(
    ({
      handle,
      requiresReview,
      platform
    }: {
      requiresReview: boolean
      handle: string
      platform: 'twitter' | 'instagram' | 'tiktok'
    }) => {
      toast(socialMediaMessages.socialMediaLoginSucess(platform))
      onCompleteSocialMediaLogin?.({
        handle,
        requiresReview,
        platform
      })
    },
    [onCompleteSocialMediaLogin, toast]
  )

  const AuthComponent = error ? handleAuthMap[error] : undefined

  const helperText =
    handle && error ? (
      <>
        {error}{' '}
        {onCompleteSocialMediaLogin && AuthComponent ? (
          <TextLink variant='visible' asChild>
            <AuthComponent
              onFailure={handleVerifyHandleError}
              onSuccess={handleLoginSuccess}
            >
              <span>{messages.linkToClaim}</span>
            </AuthComponent>
          </TextLink>
        ) : null}
      </>
    ) : null

  return (
    <HarmonyTextField
      name='handle'
      label={messages.handle}
      error={error && handle}
      helperText={helperText}
      startAdornmentText='@'
      placeholder={messages.handle}
      transformValue={(value) => value.replace(/\s/g, '')}
      debouncedValidationMs={1000}
      {...other}
    />
  )
}
