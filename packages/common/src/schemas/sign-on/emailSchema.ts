import { z } from 'zod'

import { signUpFetch } from '~/api'
import { AudiusQueryContextType } from '~/audius-query'
import { EMAIL_REGEX } from '~/utils/email'

export const emailSchemaMessages = {
  emailRequired: 'Please enter an email.',
  invalidEmail: 'Please enter a valid email.',
  emailInUse: 'Email already taken.',
  somethingWentWrong: 'Something went wrong. Try again later.',
  guestAccountExists: 'Guest account exists.'
}

export const emailSchema = <T extends AudiusQueryContextType>(
  queryContext: T
) =>
  z.object({
    email: z
      .string({ required_error: emailSchemaMessages.emailRequired })
      .regex(EMAIL_REGEX, { message: emailSchemaMessages.invalidEmail })
      .superRefine(async (email, ctx) => {
        const { emailExists: isEmailInUse, isGuest } =
          await signUpFetch.isEmailInUse({ email }, queryContext)
        if (isEmailInUse === undefined) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: emailSchemaMessages.somethingWentWrong
          })
        } else if (isGuest) {
          // complete guest accounts only
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: emailSchemaMessages.guestAccountExists
          })
          return true
        } else if (isEmailInUse) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: emailSchemaMessages.emailInUse
          })
        }
        return z.NEVER // The return value is not used, but we need to return something to satisfy the typing
      })
  })
