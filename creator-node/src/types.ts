/**
 * Type that converts a string in kebab-case to snake_case.
 * For example, the string hello-world would be converted to hello_world.
 *
 * The type is parameterized with two type parameters: T and P.
 * T is the string to convert, and P is the result of the conversion so far (accumulator).
 *
 * This uses a type guard to check if the type string is assignable to the type T. If this is the case, the type string is returned.
 *
 * If the type string is not assignable to T, the type uses type inference to extract the first character of the string (C0) and the rest of the string (R) from T. It then checks if C0 is a dash (-). If it is, the type KebabToSnake is recursively called with R as the first argument and P with an underscore (_) appended to it as the second argument. This effectively removes the first character from the string and adds an underscore to the result of the conversion so far (accumulator).
 *
 * If C0 is not a dash, the type KebabToSnake is recursively called with R as the first argument and the result of concatenating C0 and P as the second argument. This effectively removes the first character from the string and adds it to the result of the conversion so far.
 *
 * Finally, if T does not match the pattern ${infer C0}${infer R}, the type P is returned.
 * This indicates that there are no more characters left in the string to convert.
 */
export type KebabToSnake<
  T extends string,
  P extends string = ''
> = string extends T
  ? string
  : T extends `${infer C0}${infer R}`
  ? KebabToSnake<R, `${P}${C0 extends `${'-'}` ? '_' : C0}`>
  : P
