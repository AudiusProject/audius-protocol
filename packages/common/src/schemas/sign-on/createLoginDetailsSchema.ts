import { QueryClient } from '@tanstack/react-query'
import { z } from 'zod'

import { AudiusQueryContextType } from '~/audius-query'
import { isNotCommonPassword } from '~/utils/commonPasswordCheck'

import { emailSchema } from './emailSchema'

export const createLoginDetailsSchema = <T extends AudiusQueryContextType>(
  audiusQueryContext: T,
  queryClient: QueryClient
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
    .merge(emailSchema(audiusQueryContext, queryClient))
    .refine((data) => data.password === data.confirmPassword, {
      message: 'matches',
      path: ['confirmPassword']
    })
