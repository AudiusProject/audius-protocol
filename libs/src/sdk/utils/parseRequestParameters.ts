import type { z } from 'zod'

/**
 * @param name Name of the method for which the parameters are being parsed
 * @param schema Zod schema that defines the shape of the request parameters
 * @returns The parsed data or throws an error
 */
export const parseRequestParameters =
  (name: string, schema: z.ZodObject<any>) =>
  <T>(requestParameters: T) => {
    const result = schema.safeParse(requestParameters)
    if (!result.success) {
      throw new Error(`${name} request parameters not valid: ${result.error}`)
    }
    return result.data
  }
