import { Ref, forwardRef, useCallback, useContext } from 'react'

import {
  MAX_HANDLE_LENGTH,
  socialMediaMessages,
  pickHandleErrorMessages,
  useIsWaitingForValidation
} from '@audius/common'
import { TextLink } from '@audius/harmony'
import { IconCheck } from '@audius/stems'
import { useField } from 'formik'

import {
  HarmonyTextField,
  HarmonyTextFieldProps
} from 'components/form-fields/HarmonyTextField'
import { ToastContext } from 'components/toast/ToastContext'

import { SignupFlowInstagramAuth } from './SignupFlowInstagramAuth'
import { SignupFlowTikTokAuth } from './SignupFlowTikTokAuth'
import { SignupFlowTwitterAuth } from './SignupFlowTwitterAuth'

const messages = {
  handle: 'Handle',
  linkToClaim: 'Link to claim.',
  handleAvailable: 'Handle available!'
}

const handleAuthMap = {
  [pickHandleErrorMessages.twitterReservedError]: SignupFlowTwitterAuth,
  [pickHandleErrorMessages.instagramReservedError]: SignupFlowInstagramAuth,
  [pickHandleErrorMessages.tiktokReservedError]: SignupFlowTikTokAuth
}

type HandleFieldProps = Partial<HarmonyTextFieldProps> & {
  onCompleteSocialMediaLogin?: (info: {
    requiresReview: boolean
    handle: string
    platform: 'twitter' | 'instagram' | 'tiktok'
  }) => void
  onStartSocialMediaLogin?: () => void
  onErrorSocialMediaLogin?: () => void
}

export const HandleField = forwardRef(
  (props: HandleFieldProps, ref: Ref<HTMLInputElement>) => {
    const {
      onCompleteSocialMediaLogin,
      onErrorSocialMediaLogin,
      onStartSocialMediaLogin,
      onChange,
      ...other
    } = props

    const [{ value: handle }, { error }] = useField('handle')

    const { toast } = useContext(ToastContext)

    const { isWaitingForValidation, handleChange } = useIsWaitingForValidation()

    const handleVerifyHandleError = useCallback(() => {
      toast(socialMediaMessages.verificationError)
      onErrorSocialMediaLogin?.()
    }, [onErrorSocialMediaLogin, toast])

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
      handle && !!error ? (
        <>
          {error}{' '}
          {onCompleteSocialMediaLogin &&
          onStartSocialMediaLogin &&
          onErrorSocialMediaLogin &&
          AuthComponent ? (
            <TextLink variant='visible' asChild>
              <AuthComponent
                onStart={onStartSocialMediaLogin}
                onFailure={handleVerifyHandleError}
                onSuccess={handleLoginSuccess}
              >
                <span>{messages.linkToClaim}</span>
              </AuthComponent>
            </TextLink>
          ) : null}
        </>
      ) : !isWaitingForValidation && handle ? (
        messages.handleAvailable
      ) : null

    return (
      <HarmonyTextField
        ref={ref}
        name='handle'
        label={messages.handle}
        helperText={helperText}
        maxLength={MAX_HANDLE_LENGTH}
        startAdornmentText='@'
        placeholder={messages.handle}
        transformValueOnChange={(value) => value.replace(/\s/g, '')}
        debouncedValidationMs={1000}
        error={!!error && !!helperText}
        endIcon={
          !isWaitingForValidation && !error && handle ? IconCheck : undefined
        }
        onChange={(e) => {
          onChange?.(e)
          handleChange()
        }}
        {...other}
      />
    )
  }
)
