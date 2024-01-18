import { z } from 'zod'

import { isNotCommonPassword } from 'utils/commonPasswordCheck'

export const passwordSchema = z
  .object({
    password: z
      .string()
      .regex(/\d/, { message: 'hasNumber' })
      .min(8, { message: 'minLength' })
      .min(8, { message: 'notCommon' })
      .refine(isNotCommonPassword, { message: 'notCommon' }),
    confirmPassword: z.string()
  })
  .refine(
    (data) => {
      const { password, confirmPassword } = data
      return password && confirmPassword && password === confirmPassword
    },
    {
      message: 'matches',
      path: ['confirmPassword']
    }
  )
