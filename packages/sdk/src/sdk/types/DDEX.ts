import { z } from 'zod'

export const DDEXResourceContributor = z
  .object({
    name: z.string(),
    roles: z.array(z.string()),
    sequence_number: z.optional(z.number())
  })
  .strict()

export const DDEXCopyright = z
  .object({
    year: z.string(),
    text: z.string()
  })
  .strict()

export const DDEXRightsController = z
  .object({
    name: z.string(),
    roles: z.array(z.string()),
    rights_share_unknown: z.optional(z.string())
  })
  .strict()
