import { z } from 'zod'

import { signUpFetch } from '~/api'
import { AudiusQueryContextType } from '~/audius-query'

export const messages = {
  emailRequired: 'Please enter an email.',
  email: 'Please enter a valid email.',
  passwordRequired: 'Please enter a password.',
  invalidCredentials: 'Invalid credentials.',
  guestAccountExists: 'Guest account exists.'
}

export const signInSchema = (queryContext: AudiusQueryContextType) =>
  z.object({
    email: z
      .string({
        required_error: messages.emailRequired
      })
      .email(messages.email)
      .superRefine(async (email, ctx) => {
        const { isGuest } = await signUpFetch.isEmailInUse(
          { email },
          queryContext
        )
        if (isGuest) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: messages.guestAccountExists
          })
          return true
        }
        return z.NEVER // The return value is not used, but we need to return something to satisfy the typing
      }),
    password: z.string({
      required_error: messages.passwordRequired
    })
  })

export { messages as signInErrorMessages }
