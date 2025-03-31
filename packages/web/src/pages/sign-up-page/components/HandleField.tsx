import { Ref, forwardRef, useCallback, useContext } from 'react'

import { useIsWaitingForValidation } from '@audius/common/hooks'
import {
  socialMediaMessages,
  pickHandlePageMessages as messages
} from '@audius/common/messages'
import { SocialPlatform } from '@audius/common/models'
import { pickHandleErrorMessages } from '@audius/common/schemas'
import { MAX_HANDLE_LENGTH } from '@audius/common/services'
import { TextLink, IconCheck } from '@audius/harmony'
import { useField } from 'formik'

import {
  HarmonyTextField,
  HarmonyTextFieldProps
} from 'components/form-fields/HarmonyTextField'
import { ToastContext } from 'components/toast/ToastContext'

import { SignupFlowInstagramAuth } from './SignupFlowInstagramAuth'
import { SignupFlowTikTokAuth } from './SignupFlowTikTokAuth'
import { SignupFlowTwitterAuth } from './SignupFlowTwitterAuth'

const platformErrorMap = {
  [pickHandleErrorMessages.twitterReservedError]: 'twitter',
  [pickHandleErrorMessages.instagramReservedError]: 'instagram',
  [pickHandleErrorMessages.tiktokReservedError]: 'tiktok'
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
    platform: SocialPlatform
  }) => void
  onStartSocialMediaLogin?: (platform: SocialPlatform) => void
  onErrorSocialMediaLogin?: (error: Error, platform: SocialPlatform) => void
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

    const platform = platformErrorMap[error ?? '']
    const handleVerifyHandleError = useCallback(
      (error: Error) => {
        toast(socialMediaMessages.verificationError)
        onErrorSocialMediaLogin?.(error, platform as SocialPlatform)
      },
      [onErrorSocialMediaLogin, platform, toast]
    )

    const handleLoginSuccess = useCallback(
      ({
        handle,
        requiresReview,
        platform
      }: {
        requiresReview: boolean
        handle: string
        platform: SocialPlatform
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
            <AuthComponent
              onStart={onStartSocialMediaLogin}
              onFailure={handleVerifyHandleError}
              onSuccess={handleLoginSuccess}
            >
              <TextLink variant='visible'>{messages.linkToClaim}</TextLink>
            </AuthComponent>
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
        endIcon={
          !isWaitingForValidation && !error && handle ? IconCheck : undefined
        }
        IconProps={{ size: 'l', color: 'default' }}
        error={!!error}
        onChange={(e) => {
          onChange?.(e)
          handleChange()
        }}
        {...other}
      />
    )
  }
)
