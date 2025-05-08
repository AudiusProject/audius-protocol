import { QueryClient } from '@tanstack/react-query'
import { z } from 'zod'

import { QueryContextType } from '~/api'
import { isNotCommonPassword } from '~/utils/commonPasswordCheck'

import { emailSchema } from './emailSchema'

export const createLoginDetailsSchema = <T extends QueryContextType>(
  queryContext: T,
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
    .merge(emailSchema(queryContext, queryClient))
    .refine((data) => data.password === data.confirmPassword, {
      message: 'matches',
      path: ['confirmPassword']
    })
