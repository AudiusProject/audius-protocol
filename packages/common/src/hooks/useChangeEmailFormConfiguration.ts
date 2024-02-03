import { useState, useCallback, useMemo } from 'react'

import { FormikHelpers } from 'formik'
import { z } from 'zod'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { useAudiusQueryContext } from '~/audius-query'
import { useAppContext } from '~/context'
import { confirmEmailSchema, emailSchema } from '~/schemas'

import { isOtpMissingError } from './useChangePasswordFormConfiguration'

const messages = {
  invalidCredentials: 'Invalid credentials.',
  somethingWrong: 'Something went wrong.',
  passwordRequired: 'Please enter a password.',
  emailUpdated: 'Email updated!'
}

export enum ChangeEmailPage {
  ConfirmPassword = 0,
  NewEmail = 1,
  VerifyEmail = 2
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

export const useChangeEmailFormConfiguration = (onComplete: () => void) => {
  const { audiusBackend } = useAppContext()
  const [page, setPage] = useState(ChangeEmailPage.ConfirmPassword)
  const audiusQueryContext = useAudiusQueryContext()
  const EmailSchema = useMemo(
    () => toFormikValidationSchema(emailSchema(audiusQueryContext)),
    [audiusQueryContext]
  )

  const validationSchema =
    page === ChangeEmailPage.ConfirmPassword
      ? confirmPasswordFormikSchema
      : page === ChangeEmailPage.NewEmail
      ? EmailSchema
      : page === ChangeEmailPage.VerifyEmail
      ? verifyEmailFormikSchema
      : undefined

  const checkPassword = useCallback(
    async (
      values: ChangeEmailFormValues,
      helpers: FormikHelpers<ChangeEmailFormValues>
    ) => {
      const { oldEmail, password } = values
      const libs = await audiusBackend.getAudiusLibsTyped()
      try {
        const confirmed = await libs.Account?.confirmCredentials({
          username: oldEmail,
          password,
          softCheck: true
        })
        if (confirmed) {
          helpers.setFieldTouched('email', false)
          setPage(ChangeEmailPage.NewEmail)
        } else {
          helpers.setFieldError('password', messages.invalidCredentials)
        }
      } catch (e) {
        helpers.setFieldError('password', messages.invalidCredentials)
      }
    },
    [setPage, audiusBackend]
  )

  const changeEmail = useCallback(
    async (
      values: ChangeEmailFormValues,
      helpers: FormikHelpers<ChangeEmailFormValues>
    ) => {
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
        onComplete()
      } catch (e) {
        if (isOtpMissingError(e)) {
          helpers.setFieldTouched('otp', false)
          setPage(ChangeEmailPage.VerifyEmail)
        } else {
          helpers.setFieldError('otp', messages.invalidCredentials)
          helpers.setFieldError('email', messages.somethingWrong)
        }
      }
    },
    [setPage, onComplete, audiusBackend]
  )

  const onSubmit = useCallback(
    async (
      values: ChangeEmailFormValues,
      helpers: FormikHelpers<ChangeEmailFormValues>
    ) => {
      if (page === ChangeEmailPage.ConfirmPassword) {
        await checkPassword(values, helpers)
      } else if (page === ChangeEmailPage.VerifyEmail) {
        await changeEmail(values, helpers)
      } else {
        await changeEmail(values, helpers)
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
