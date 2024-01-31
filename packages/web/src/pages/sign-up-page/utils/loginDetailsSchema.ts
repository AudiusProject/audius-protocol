import { AudiusQueryContextType } from '@audius/common'
import { emailSchema } from '@audius/common/schemas'
import { isNotCommonPassword } from '@audius/common/utils'
import { z } from 'zod'

// Due to issue with zod merge, manually rewriting
// https://github.com/colinhacks/zod/issues/454
export const loginDetailsSchema = (
  audiusQueryContext: AudiusQueryContextType
) =>
  z
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
