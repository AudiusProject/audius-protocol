import { z } from 'zod'

import { decodeHashId, encodeHashId } from '~/utils/hashIds'

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

export const Id = z.number().transform<string>((data: number, context) => {
  const id = encodeHashId(data)
  if (id === null) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Hash id is invalid'
    })

    return z.NEVER
  }
  return id
})
