import { z } from 'zod'
import { HashId } from '../../types/HashId'

export const ClaimRewardsSchema = z
  .object({
    challengeId: z.string(),
    specifier: z.string(),
    amount: z.number(),
    userId: HashId
  })
  .strict()

export type ClaimRewardsRequest = z.input<typeof ClaimRewardsSchema>
