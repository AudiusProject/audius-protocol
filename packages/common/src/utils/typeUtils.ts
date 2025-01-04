// https://github.com/microsoft/TypeScript/pull/29955#issuecomment-470062531
export function removeNullable<T>(
  value: T
): value is Exclude<T, false | null | undefined | '' | 0> {
  return Boolean(value)
}

export type NestedNonNullable<T> = {
  [P in keyof T]-?: NestedNonNullable<NonNullable<T[P]>>
}

export type Nullable<T> = T | null
export type DeepNullable<T> = {
  [K in keyof T]: DeepNullable<T[K]> | null
}
export type Overwrite<T, U extends keyof T, V> = Omit<T, U> & V
export type Maybe<T> = T | undefined

/**
 *
 * `Brand` allows you to 'specialize' a type to introduce
 * nominal typing to TS.
 *
 * Example:
 * ```
 * type USD = Brand<number, 'USD'>
 * const balance = 3 as USD
 * ```
 *
 */
export type Brand<T, U extends string> = T & { _brand: U }

export type ValueOf<T> = T[keyof T]

export function isNullOrUndefined(obj: any): obj is null | undefined {
  return obj === null || obj === undefined
}

/**
 * Utility type to improve type hints for editors.
 * @see https://www.totaltypescript.com/concepts/the-prettify-helper
 */
export type Prettify<T> = {
  [K in keyof T]: T[K]
} & {}

/**
 * Same concept as `Pick` but adds a 3rd argument to rename the key you're picking.
 * Only works for a single key.
 * https://stackoverflow.com/questions/59071058/how-to-pick-and-rename-certain-keys-using-typescript
 */
export type PickRename<
  Type,
  Key extends keyof Type,
  RenamedKey extends PropertyKey
> = Omit<Type, Key> & {
  [k in RenamedKey]: Type[Key]
}

// Adjusted from Terry: https://stackoverflow.com/questions/61132262/typescript-deep-partial
export type DeepPartial<T> = T extends any[]
  ? T
  : T extends Set<any>
    ? T
    : T extends object
      ? {
          [P in keyof T]?: DeepPartial<T[P]>
        }
      : T

/**
 * Recurses through an object and removes all keys that match K.
 * e.g.
 * type Foo = {
 *   a: {
 *     b: string
 *     c: { b: string }
 *   }
 * }
 * DeepOmit<Foo, 'b'> results in
 * {
 *   a: {
 *     c: { }
 *   }
 * }
 */
export type DeepOmit<T, K> = T extends object
  ? {
      [P in keyof T as P extends K ? never : P]: DeepOmit<T[P], K>
    }
  : T
