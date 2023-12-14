import { emailSchema, isNotCommonPassword } from '@audius/common'
import { z } from 'zod'

import { audiusQueryContext } from 'app/AudiusQueryProvider'

// Due to issue with zod merge, manually rewriting
// https://github.com/colinhacks/zod/issues/454
export const loginDetailsSchema = z
  .object({
    password: z
      .string()
      .regex(/\d/, { message: 'hasNumber' })
      .min(8, { message: 'minLength' })
      .refine(isNotCommonPassword, { message: 'notCommon' }),
    confirmPassword: z.string()
  })
  .merge(emailSchema(audiusQueryContext))
  .refine((data) => data.password === data.confirmPassword, {
    message: 'matches',
    path: ['confirmPassword']
  })
