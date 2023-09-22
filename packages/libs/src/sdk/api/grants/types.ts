import { z } from 'zod'

import { HashId } from '../../types/HashId'
import { isApiKeyValid } from '../../utils/apiKey'

export const CreateGrantSchema = z.object({
  userId: HashId,
  appApiKey: z.custom<string>((data: unknown) => {
    return isApiKeyValid(data as string)
  })
})

export type CreateGrantRequest = z.input<typeof CreateGrantSchema>

export const RevokeGrantSchema = z.object({
  userId: HashId,
  appApiKey: z.custom<string>((data: unknown) => {
    return isApiKeyValid(data as string)
  })
})

export type RevokeGrantRequest = z.input<typeof RevokeGrantSchema>
