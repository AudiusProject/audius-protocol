import { z } from 'zod'

/**
 * Type representing a file in Node environment
 */
const NodeFileSchema = z.object({
  buffer: z.custom<Buffer>((data: unknown) => data),
  name: z.optional(z.string())
})
export type NodeFile = z.infer<typeof NodeFileSchema>

const BrowserFileSchema = z.custom<File>((data: unknown) => data)
export type BrowserFile = z.infer<typeof BrowserFileSchema>

/**
 * Type representing a file in Node and browser environments
 */
export const CrossPlatformFileSchema = z.union([
  NodeFileSchema,
  BrowserFileSchema
])
export type CrossPlatformFile = z.infer<typeof CrossPlatformFileSchema>

export const isNodeFile = (file: CrossPlatformFile): file is NodeFile => {
  if (file && (file as NodeFile).buffer) {
    return true
  }
  return false
}
