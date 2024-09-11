import { TextLink, TextLinkProps } from '@audius/harmony'

import { ExternalLink, ExternalLinkProps } from './ExternalLink'

type ExternalTextLinkProps = Omit<TextLinkProps, 'href'> & ExternalLinkProps

export const ExternalTextLink = (props: ExternalTextLinkProps) => {
  const { to, onClick, source, ignoreWarning, children, ...other } = props
  return (
    <TextLink asChild {...other}>
      <ExternalLink
        to={to}
        onClick={onClick}
        source={source}
        ignoreWarning={ignoreWarning}
      >
        {children}
      </ExternalLink>
    </TextLink>
  )
}
