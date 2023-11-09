import { by } from 'detox'
import type { Role as RNRole } from 'react-native'
type Role = 'textbox' | RNRole

type ByRoleOptions = {
  name: string | RegExp
  labelOnly?: boolean
}

export function byRole(
  role: Role,
  options: ByRoleOptions
): Detox.IndexableNativeElement {
  const { name, labelOnly } = options
  switch (role) {
    case 'textbox':
      // @ts-ignore -- technically not an indexable native element
      return element(by.label(name)).atIndex(1)
    case 'heading':
      return element(by.label(name))
    case 'button':
      return labelOnly
        ? element(by.traits(['button']).and(by.label(name)))
        : element(by.traits(['button']).withDescendant(by.label(name)))
    case 'checkbox':
      return element(by.id(name))
    case 'radio':
      return element(by.id(name))
    default:
      return element(by.traits([role]).and(by.label(name)))
  }
}

export function byText(text: string | RegExp) {
  return element(by.text(text))
}
