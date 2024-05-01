import { TextLink, TextLinkProps } from '@audius/harmony'

import {
  ServerExternalLink,
  ServerExternalLinkProps
} from './ServerExternalLink'

type ServerExternalTextLinkProps = Omit<TextLinkProps, 'href'> &
  ServerExternalLinkProps

export const ServerExternalTextLink = (props: ServerExternalTextLinkProps) => {
  const { to, onClick, source, ignoreWarning, children, ...other } = props
  return (
    <TextLink asChild {...other}>
      <ServerExternalLink
        to={to}
        onClick={onClick}
        source={source}
        ignoreWarning={ignoreWarning}
      >
        {children}
      </ServerExternalLink>
    </TextLink>
  )
}
