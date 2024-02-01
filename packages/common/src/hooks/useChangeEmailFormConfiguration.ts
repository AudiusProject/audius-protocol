import { FormikHelpers } from 'formik'
import { useState, useCallback, useMemo } from 'react'
import { useAppContext } from '~/context'
import { confirmEmailSchema, emailSchema } from '~/schemas'
import { toFormikValidationSchema } from 'zod-formik-adapter'
import { useAudiusQueryContext } from '~/audius-query'
import { isOtpMissingError } from './useChangePasswordFormConfiguration'
import { z } from 'zod'

const messages = {
  invalidCredentials: 'Invalid credentials.',
  somethingWrong: 'Something went wrong.',
  passwordRequired: 'Please enter a password.'
}

export enum ChangeEmailPage {
  ConfirmPassword = 0,
  NewEmail = 1,
  VerifyEmail = 2,
  Success = 3
}

export type ChangeEmailFormValues = {
  email: string
  oldEmail: string
  password: string
  otp: string
}

const initialValues: ChangeEmailFormValues = {
  email: '',
  oldEmail: '',
  password: '',
  otp: ''
}

const confirmPasswordFormikSchema = toFormikValidationSchema(
  z.object({
    password: z.string({
      required_error: messages.passwordRequired
    })
  })
)
const verifyEmailFormikSchema = toFormikValidationSchema(confirmEmailSchema)

export const useChangeEmailFormConfiguration = () => {
  const { audiusBackend } = useAppContext()
  const [page, setPage] = useState(ChangeEmailPage.Success)
  const audiusQueryContext = useAudiusQueryContext()
  const EmailSchema = useMemo(
    () => toFormikValidationSchema(emailSchema(audiusQueryContext)),
    [audiusQueryContext]
  )

  console.log({ page })

  const validationSchema =
    page === ChangeEmailPage.ConfirmPassword
      ? confirmPasswordFormikSchema
      : page === ChangeEmailPage.NewEmail
      ? EmailSchema
      : page === ChangeEmailPage.VerifyEmail
      ? verifyEmailFormikSchema
      : undefined

  const checkPassword = useCallback(
    async (values: ChangeEmailFormValues, onError: () => void) => {
      const { oldEmail, password } = values
      const libs = await audiusBackend.getAudiusLibsTyped()
      try {
        console.log({ oldEmail, password })
        const confirmed = await libs.Account?.confirmCredentials({
          username: oldEmail,
          password,
          softCheck: true
        })
        if (confirmed) {
          setPage(ChangeEmailPage.NewEmail)
        } else {
          onError()
        }
      } catch (e) {
        onError()
      }
    },
    [setPage, audiusBackend]
  )

  const changeEmail = useCallback(
    async (values: ChangeEmailFormValues, onError: () => void) => {
      const { oldEmail, password, email, otp } = values
      const sanitizedOtp = otp.replace(/\s/g, '')
      const libs = await audiusBackend.getAudiusLibsTyped()
      try {
        // Try to change email
        await libs.identityService!.changeEmail({
          email,
          otp: sanitizedOtp
        })
        await libs.Account!.changeCredentials({
          newUsername: email,
          newPassword: password,
          oldUsername: oldEmail,
          oldPassword: password
        })
        setPage(ChangeEmailPage.Success)
      } catch (e) {
        if (isOtpMissingError(e)) {
          setPage(ChangeEmailPage.VerifyEmail)
        } else {
          onError()
        }
      }
    },
    [setPage, audiusBackend]
  )

  const onSubmit = useCallback(
    async (
      values: ChangeEmailFormValues,
      helpers: FormikHelpers<ChangeEmailFormValues>
    ) => {
      if (page === ChangeEmailPage.ConfirmPassword) {
        await checkPassword(values, () => {
          helpers.setFieldError('password', messages.invalidCredentials)
        })
      } else if (page === ChangeEmailPage.VerifyEmail) {
        await changeEmail(values, () => {
          helpers.setFieldError('otp', messages.invalidCredentials)
        })
      } else {
        await changeEmail(values, () => {
          helpers.setFieldError('email', messages.somethingWrong)
        })
      }
    },
    [page, changeEmail, checkPassword]
  )

  return {
    initialValues,
    validateOnChange: false,
    validationSchema,
    onSubmit,
    page,
    setPage
  }
}
