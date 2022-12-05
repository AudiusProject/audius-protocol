export type ArrayElement<A> = A extends readonly (infer T)[] ? T : never
type DeepWriteable<T> = { -readonly [P in keyof T]: DeepWriteable<T[P]> }
type Cast<X, Y> = X extends Y ? X : Y
type FromEntries<T> = T extends [infer Key, any][]
  ? { [K in Cast<Key, string>]: Extract<ArrayElement<T>, [K, any]>[1] }
  : { [key in string]: any }

export type FromEntriesWithReadOnly<T> = FromEntries<DeepWriteable<T>>

declare global {
  interface ObjectConstructor {
    fromEntries<T>(obj: T): FromEntriesWithReadOnly<T>
    // Allow Object.keys() to return more specific types than string when possible.
    // For example, instead of returning string[] it can return ('a' | 'b')[]
    keys<T = string>(o = {}): T[]
    entries<K extends string, T>(o: { [s: K]: T } | ArrayLike<T>): [K, T][]
  }
}
