import { z } from 'zod'

import { AudiusQueryContextType } from 'audius-query'
import { signUpFetch } from 'src/api'
import { EMAIL_REGEX } from 'utils/email'

export const emailSchemaMessages = {
  invalidEmail: 'Please enter a valid email.',
  emailInUse: 'Email already taken.'
}

export const emailSchema = <T extends AudiusQueryContextType>(
  queryContext: T
) =>
  z.object({
    email: z
      .string({ required_error: emailSchemaMessages.invalidEmail })
      .regex(EMAIL_REGEX, { message: emailSchemaMessages.invalidEmail })
      .refine(
        async (email) => {
          return !(await signUpFetch.isEmailInUse({ email }, queryContext))
        },
        { message: emailSchemaMessages.emailInUse }
      )
  })
