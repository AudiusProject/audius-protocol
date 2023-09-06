import { LeftNavLink, LeftNavLinkProps } from '../LeftNavLink'

const messages = {
  empty: 'Create your first playlist!'
}

type EmptyLibraryNavLinkProps = LeftNavLinkProps

export const EmptyLibraryNavLink = (props: EmptyLibraryNavLinkProps) => {
  return (
    <LeftNavLink disabled {...props}>
      {messages.empty}
    </LeftNavLink>
  )
}
