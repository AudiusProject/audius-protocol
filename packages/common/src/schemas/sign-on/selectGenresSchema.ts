import { z } from 'zod'

export const selectGenresSchema = z.object({
  genres: z.array(z.string()).min(3)
})
