import { z } from 'zod'
import { isApiKeyValid } from '../utils/file'

export const IsWriteAccessGrantedSchema = z.object({
  userId: z.string(),
  apiKey: z.optional(
    z.custom<string>((data: unknown) => {
      return isApiKeyValid(data as string)
    })
  )
})

export type IsWriteAccessGrantedRequest = z.input<
  typeof IsWriteAccessGrantedSchema
>

export type OAuthScope = 'read' | 'write'
