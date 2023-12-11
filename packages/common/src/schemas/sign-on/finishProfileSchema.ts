import { z } from 'zod'

import { MAX_DISPLAY_NAME_LENGTH } from 'services/oauth/formatSocialProfile'

export const finishProfileSchema = z.object({
  displayName: z.string().max(MAX_DISPLAY_NAME_LENGTH, ''),
  profileImage: z.object({
    uri: z.string()
  }),
  coverPhoto: z
    .object({
      uri: z.string().optional()
    })
    .optional()
})
