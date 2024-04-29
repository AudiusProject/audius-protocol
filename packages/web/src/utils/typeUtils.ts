export function removeNullable<T>(
  value: T
): value is Exclude<T, false | null | undefined | '' | 0> {
  return Boolean(value)
}
