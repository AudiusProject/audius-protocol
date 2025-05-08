import { QueryClient } from '@tanstack/react-query'
import { z } from 'zod'

import { QUERY_KEYS } from '~/api'
import { fetchEmailInUse } from '~/api/tan-query/users/useEmailInUse'
import { QueryContextType } from '~/api'

export const messages = {
  emailRequired: 'Please enter an email.',
  email: 'Please enter a valid email.',
  passwordRequired: 'Please enter a password.',
  invalidCredentials: 'Invalid credentials.',
  guestAccountExists: 'Guest account exists.'
}

export const signInSchema = (
  queryContext: QueryContextType,
  queryClient: QueryClient
) =>
  z.object({
    email: z
      .string({
        required_error: messages.emailRequired
      })
      .email(messages.email)
      .superRefine(async (email, ctx) => {
        const { isGuest } = await queryClient.fetchQuery({
          queryKey: [QUERY_KEYS.emailInUse, email],
          queryFn: async () => await fetchEmailInUse(email, queryContext)
        })
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
