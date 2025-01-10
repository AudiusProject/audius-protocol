import { z } from 'zod'

import { decodeHashId, encodeHashId } from '../utils/hashId'

export const OptionalHashId = z
  .string()
  .nullable()
  .optional()
  .transform<number | undefined>((data: string | null | undefined) =>
    data ? (decodeHashId(data) ?? undefined) : undefined
  )

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

export const OptionalId = z
  .number()
  .nullable()
  .optional()
  .transform<string | undefined>((data: number | null | undefined) =>
    data ? (encodeHashId(data) ?? undefined) : undefined
  )

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
