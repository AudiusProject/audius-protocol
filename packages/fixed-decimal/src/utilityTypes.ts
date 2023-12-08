/**
 * `Brand` allows you to 'specialize' a type to introduce
 * nominal typing to TS.
 *
 * Example:
 * ```
 * type USD = Brand<number, 'USD'>
 * const balance = 3 as USD
 * ```
 * @see {@link file://./../../common/src/utils/typeUtils.ts typeUtils.ts}
 * @see https://dev.to/andersonjoseph/typescript-tip-safer-functions-with-branded-types-14o4
 */
export type Brand<T, U extends string> = T & { _brand: U }
/**
 * Ensures the type parameter is unbranded.
 * @see {@link Brand}
 */
export type NoBrand<T> = T & { _brand?: never }
