import { z } from 'zod'

import { EMAIL_REGEX } from 'utils/email'

const messages = {
  invalidEmail: 'Please enter a valid email.'
}

export const emailSchema = z.object({
  email: z
    .string({ required_error: messages.invalidEmail })
    .regex(EMAIL_REGEX, { message: messages.invalidEmail })
})
