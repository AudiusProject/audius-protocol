import { useState, useCallback } from 'react'

import { FormikHelpers } from 'formik'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { useAppContext } from '../context'
import { confirmEmailSchema, passwordSchema, signInSchema } from '../schemas'

const messages = {
  invalidCredentials: 'Invalid credentials.',
  accountMatchError: "Account doesn't match the currently signed in user.",
  passwordUpdated: 'Password updated!'
}

export enum ChangePasswordPage {
  ConfirmCredentials = 0,
  VerifyEmail = 1,
  NewPassword = 2
}

const OTP_ERROR = 'Missing otp'
export const isOtpMissingError = (e: unknown) => {
  return (
    e instanceof Object &&
    'response' in e &&
    e.response instanceof Object &&
    'data' in e.response &&
    e.response.data instanceof Object &&
    'error' in e.response.data &&
    e.response.data.error === OTP_ERROR
  )
}

const passwordFormikSchema = toFormikValidationSchema(passwordSchema)
const confirmCredentialsFormikSchema = toFormikValidationSchema(signInSchema)
const verifyEmailFormikSchema = toFormikValidationSchema(confirmEmailSchema)

export type ChangePasswordFormValues = {
  email: string
  oldPassword: string
  password: string
  confirmPassword: string
  otp: string
}

const initialValues: ChangePasswordFormValues = {
  email: '',
  oldPassword: '',
  password: '',
  confirmPassword: '',
  otp: ''
}

export const useChangePasswordFormConfiguration = (onComplete: () => void) => {
  const { audiusBackend } = useAppContext()
  const [page, setPage] = useState(ChangePasswordPage.ConfirmCredentials)

  const validationSchema =
    page === ChangePasswordPage.NewPassword
      ? passwordFormikSchema
      : page === ChangePasswordPage.ConfirmCredentials
      ? confirmCredentialsFormikSchema
      : page === ChangePasswordPage.VerifyEmail
      ? verifyEmailFormikSchema
      : undefined

  const confirmCredentials = useCallback(
    async (
      values: ChangePasswordFormValues,
      helpers: FormikHelpers<ChangePasswordFormValues>
    ) => {
      const { email, password, otp } = values
      const sanitizedOtp = otp.replace(/\s/g, '')
      const libs = await audiusBackend.getAudiusLibsTyped()
      try {
        const confirmed = await libs.Account?.confirmCredentials({
          email,
          username: email,
          password,
          otp: sanitizedOtp
        })
        if (confirmed) {
          // Helper to move "password" to "oldPassword"
          helpers.setFieldValue('oldPassword', values.password)
          helpers.setFieldValue('password', '', false)
          helpers.setFieldTouched('password', false)
          helpers.setFieldTouched('confirmPassword', false)
          setPage(ChangePasswordPage.NewPassword)
        } else {
          helpers.setFieldError('otp', messages.accountMatchError)
        }
      } catch (e) {
        if (isOtpMissingError(e)) {
          helpers.setFieldTouched('otp', false)
          setPage(ChangePasswordPage.VerifyEmail)
        } else {
          helpers.setFieldError('password', messages.invalidCredentials)
          helpers.setFieldError('otp', messages.invalidCredentials)
        }
      }
    },
    [setPage, audiusBackend]
  )

  const changeCredentials = useCallback(
    async (values: ChangePasswordFormValues) => {
      const { email, oldPassword, password } = values
      const libs = await audiusBackend.getAudiusLibsTyped()
      await libs.Account?.changeCredentials({
        newUsername: email,
        newPassword: password,
        oldUsername: email,
        oldPassword
      })
      onComplete()
    },
    [onComplete, audiusBackend]
  )

  const onSubmit = useCallback(
    async (
      values: ChangePasswordFormValues,
      helpers: FormikHelpers<ChangePasswordFormValues>
    ) => {
      if (page === ChangePasswordPage.NewPassword) {
        await changeCredentials(values)
      } else {
        await confirmCredentials(values, helpers)
      }
    },
    [page, confirmCredentials, changeCredentials]
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
