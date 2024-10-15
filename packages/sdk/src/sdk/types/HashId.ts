import { z } from 'zod'

import { decodeHashId } from '../utils/hashId'

export const HashId = z.string().transform<number>((data: string, context) => {
  const id = decodeHashId(data)
  if (id === null) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Hash id is invalid'
    })

    return z.NEVER
  }
  return id
})
