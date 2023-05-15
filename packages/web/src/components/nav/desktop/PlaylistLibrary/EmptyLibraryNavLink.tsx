import { LeftNavLink } from '../LeftNavLink'

const messages = {
  empty: 'Create your first playlist!'
}

export const EmptyLibraryNavLink = () => {
  return <LeftNavLink disabled>{messages.empty}</LeftNavLink>
}
