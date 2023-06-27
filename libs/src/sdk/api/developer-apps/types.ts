import { z } from 'zod'
import { HashId } from '../../types/HashId'
import { isApiKeyValid } from '../../utils/apiKey'

export const CreateDeveloperAppSchema = z.object({
  name: z.string(),
  description: z.optional(z.string().max(128)),
  userId: HashId
})

export type CreateDeveloperAppRequest = z.input<typeof CreateDeveloperAppSchema>

export const DeleteDeveloperAppSchema = z.object({
  userId: HashId,
  appApiKey: z.custom<string>((data: unknown) => {
    return isApiKeyValid(data as string)
  })
})

export type DeleteDeveloperAppRequest = z.input<typeof DeleteDeveloperAppSchema>
