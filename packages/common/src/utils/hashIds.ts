import { decodeHashId, encodeHashId } from '@audius/sdk'
import { z } from 'zod'

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

/** Parses a `Nullable<ID>` safely for use with SDK functions which acccept an optional
   id parameter.
*/
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
