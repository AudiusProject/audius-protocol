import { z } from 'zod'

import { isNotCommonPassword } from 'utils/commonPasswordCheck'

import { emailSchema } from './emailSchema'

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
  .merge(emailSchema)
  .refine((data) => data.password === data.confirmPassword, {
    message: 'matches',
    path: ['confirmPassword']
  })
