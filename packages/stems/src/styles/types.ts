import { CSSProperties } from 'react'

/** Type override to allow usage of custom properties in the
 * `style' prop. We're using this instead of augmenting the csstype module
 * because that currently breaks types for some third-party modules. Note that
 * you will have to cast it back to CSSProperties in most cases.
 * Usage:
 * ```
 * const style: CSSCustomProperties = {
 *   width: '10px',
 *   '--custom-prop': 'var(--custom-var-value)
 * }
 *
 * return <button style={style as CSSProperties} />
 * ```
 */
export type CSSCustomProperties = CSSProperties & {
  // Allow any CSS Custom Properties
  [index: `--${string}`]: any
}
