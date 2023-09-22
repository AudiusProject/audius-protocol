import type { ZodError, z } from 'zod'

export class ParseRequestError extends Error {
  override name = 'ParseRequestError' as const
  constructor(public method: string, public innerError: ZodError) {
    super(`'${method}' => ${innerError.message}`)
  }
}

/**
 * @param name Name of the method for which the parameters are being parsed
 * @param schema Zod schema that defines the shape of the request parameters
 * @returns The parsed data or throws an error
 */
export const parseParams =
  <T extends z.ZodType>(name: string, schema: T) =>
  async <J>(params: J): Promise<z.infer<T>> => {
    const result = await schema.safeParseAsync(params)
    if (!result.success) {
      throw new ParseRequestError(name, result.error)
    }
    return result.data
  }
