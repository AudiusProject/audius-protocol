type ExternalLinkProps = JSX.IntrinsicElements['a']

export const ExternalLink = (props: ExternalLinkProps) => {
  return <a {...props} target='_blank' rel='noopener noreferrer' />
}
