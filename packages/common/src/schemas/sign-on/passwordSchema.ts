import { z } from 'zod'

import { isNotCommonPassword } from 'utils/commonPasswordCheck'

export const passwordSchema = z
  .object({
    password: z
      .string()
      .regex(/\d/, { message: 'hasNumber' })
      .min(8, { message: 'minLength' })
      .refine(isNotCommonPassword, { message: 'notCommon' }),
    confirmPassword: z.string()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'matches',
    path: ['confirmPassword']
  })
