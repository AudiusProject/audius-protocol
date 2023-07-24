import { z } from 'zod'

/**
 * Type representing a file in Node environment
 */
const NodeFile = z.object({
  buffer: z.custom<Buffer>((data: unknown) => data),
  name: z.optional(z.string())
})

const BrowserFile = z.custom<File>((data: unknown) => data)

/**
 * Type representing a file in Node and browser environments
 */
export const CrossPlatformFile = z.union([NodeFile, BrowserFile])

export const isNodeFile = (
  file: z.infer<typeof CrossPlatformFile>
): file is z.infer<typeof NodeFile> => {
  if (file && (file as z.infer<typeof NodeFile>).buffer) {
    return true
  }
  return false
}
