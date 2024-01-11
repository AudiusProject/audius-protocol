import {
  Ref,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useState
} from 'react'

import {
  MAX_HANDLE_LENGTH,
  socialMediaMessages,
  pickHandleErrorMessages
} from '@audius/common'
import { TextLink } from '@audius/harmony'
import { IconCheck } from '@audius/stems'
import { useField, useFormikContext } from 'formik'

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

/**
 * This is a workaround because Formik's isValidating only returns true DURING the validation.
 * However for this scenario we want to wait for the results of the validation before showing any messaging.
 * To do this we wait for Formik isValidating to change to true, then wait for it to change
 * back to false before saying we're "not waiting" for validation anymore
 * @returns {isWaitingOnValidation, setIsWaitingOnValidation}
 */
const useIsWaitingOnValidation = () => {
  const { isValidating } = useFormikContext()
  const [isWaitingOnValidation, setIsWaitingOnValidation] = useState(false)
  const [previousIsValidating, setPreviousIsValidating] = useState(false)

  // Wait for formik to start validating
  useEffect(() => {
    if (isValidating && isWaitingOnValidation) {
      setPreviousIsValidating(true)
    }
  }, [isValidating, isWaitingOnValidation])

  // We know formik has stopped validating when it differs from our previous value
  useEffect(() => {
    if (previousIsValidating && !isValidating) {
      setIsWaitingOnValidation(false)
      setPreviousIsValidating(false) // reset the value
    }
  }, [isValidating, previousIsValidating])

  return { isWaitingOnValidation, setIsWaitingOnValidation }
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

    const { isWaitingOnValidation, setIsWaitingOnValidation } =
      useIsWaitingOnValidation()

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
      ) : !isWaitingOnValidation && handle ? (
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
        endIcon={!isWaitingOnValidation && !error ? IconCheck : undefined}
        onChange={(e) => {
          onChange?.(e)
          setIsWaitingOnValidation(true)
        }}
        {...other}
      />
    )
  }
)
