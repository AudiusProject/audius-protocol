import { z } from 'zod'

import { decodeHashId, encodeHashId } from '~/utils/hashIds'

// TODO: Move usage of these utils
// to the version in packages/common/src/models/Identifiers.ts
// https://linear.app/audius/issue/PAY-2997/migrate-idhashid-usage-to-models-version
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
