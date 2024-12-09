import { useState, useCallback, useMemo } from 'react'

import { FormikHelpers } from 'formik'
import { z } from 'zod'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { useAudiusQueryContext } from '~/audius-query'
import { useAppContext } from '~/context'
import { confirmEmailSchema, emailSchema } from '~/schemas'

import { isOtpMissingError } from './useChangePasswordFormConfiguration'

// Note: Not an SDK RequestError as it comes from Hedgehog
const INVALID_CREDENTIALS_ERROR = 'Invalid credentials'
const isInvalidCredentialsError = (e: unknown) => {
  return (
    e instanceof Error &&
    'response' in e &&
    e.response instanceof Object &&
    'data' in e.response &&
    e.response.data instanceof Object &&
    'error' in e.response.data &&
    e.response.data.error === INVALID_CREDENTIALS_ERROR
  )
}

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
  const reportToSentry = audiusQueryContext.reportToSentry

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
      throw new Error('Not implemented')
    },
    [setPage, audiusBackend]
  )

  const changeEmail = useCallback(
    async (
      values: ChangeEmailFormValues,
      helpers: FormikHelpers<ChangeEmailFormValues>
    ) => {
      throw new Error('Not implemented')
    },
    [setPage, onComplete, audiusBackend, reportToSentry]
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
