import { FormikHelpers } from 'formik'
import { useState, useCallback } from 'react'
import { useAppContext } from '~/context'
import { confirmEmailSchema, passwordSchema, signInSchema } from '~/schemas'
import { toFormikValidationSchema } from 'zod-formik-adapter'

const messages = {
  invalidCredentials: 'Invalid credentials.',
  accountMatchError: "Account doesn't match the currently signed in user."
}

export enum ChangePasswordPage {
  ConfirmCredentials = 0,
  VerifyEmail = 1,
  NewPassword = 2,
  Success = 3
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

export const useChangePasswordFormConfiguration = () => {
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

  const validateOnChange =
    page === ChangePasswordPage.NewPassword ? true : false

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
          helpers.setFieldValue('password', '')
          setPage(ChangePasswordPage.NewPassword)
        } else {
          helpers.setFieldError('otp', messages.accountMatchError)
        }
      } catch (e) {
        if (isOtpMissingError(e)) {
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
      setPage(ChangePasswordPage.Success)
    },
    [setPage, audiusBackend]
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
    validateOnChange,
    validationSchema,
    onSubmit,
    page,
    setPage
  }
}
