import { kebabCase } from 'lodash'

/** Converts a camelCased variable name such as `primaryDark1` to an
 * equivalent CSS variable name (`--primary-dark-1`). Useful for passing
 * values like color names to a component to be converted to a CSS
 * property set via `style`
 */
export const toCSSVariableName = (name: string) => {
  // TODO: support harmony variable names (prefix harmony?)
  return `--${kebabCase(name)}`
}
