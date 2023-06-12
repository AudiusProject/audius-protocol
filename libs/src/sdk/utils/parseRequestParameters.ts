import type { ZodError, z } from 'zod'

export class ParseRequestError extends Error {
  override name: 'ParseRequestError' = 'ParseRequestError'
  constructor(public method: string, public innerError: ZodError) {
    super(`'${method}' => ${innerError.message}`)
  }
}

/**
 * @param name Name of the method for which the parameters are being parsed
 * @param schema Zod schema that defines the shape of the request parameters
 * @returns The parsed data or throws an error
 */
export const parseRequestParameters =
  <T extends z.AnyZodObject>(name: string, schema: T) =>
  <J>(requestParameters: J): z.infer<T> => {
    const result = schema.safeParse(requestParameters)
    if (!result.success) {
      throw new ParseRequestError(name, result.error)
    }
    return result.data
  }
