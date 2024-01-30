import { z } from 'zod'

import { AudiusQueryContextType } from '~/audius-query'
import { signUpFetch } from '~/api'
import { EMAIL_REGEX } from '~/utils/email'

export const emailSchemaMessages = {
  emailRequired: 'Please enter an email.',
  invalidEmail: 'Please enter a valid email.',
  emailInUse: 'Email already taken.',
  somethingWentWrong: 'Something went wrong. Try again later.'
}

export const emailSchema = <T extends AudiusQueryContextType>(
  queryContext: T
) =>
  z.object({
    email: z
      .string({ required_error: emailSchemaMessages.emailRequired })
      .regex(EMAIL_REGEX, { message: emailSchemaMessages.invalidEmail })
      .superRefine(async (email, ctx) => {
        const validEmail = EMAIL_REGEX.test(email)
        if (!validEmail) return true
        const isEmailInUse = await signUpFetch.isEmailInUse(
          { email },
          queryContext
        )
        if (isEmailInUse === undefined) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: emailSchemaMessages.somethingWentWrong
          })
          return true
        } else if (isEmailInUse) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: emailSchemaMessages.emailInUse
          })
          return true
        }
        return false
      })
  })
