import { Link } from './Link'
import { Tip } from './Tip'

const messages = {
  title: '🚫 Deprecated component',
  description:
    'This is a legacy component and will be deprecated in the next major version. Please consider using the ',
  instead: 'instead'
}

type DeprecatedWarningProps = {
  alternativeName: string
  alternativeLinkTo: { kind: string; story: string }
}

export const DeprecatedWarning = (props: DeprecatedWarningProps) => {
  const { alternativeName, alternativeLinkTo } = props

  return (
    <Tip
      title={messages.title}
      description={
        <p css={{ margin: 0 }}>
          {messages.description}
          <Link {...alternativeLinkTo}>{alternativeName}</Link>{' '}
          {messages.instead}
        </p>
      }
      css={{
        borderColor: 'var(--harmony-docs-deprecated-color)',
        background: 'rgba(255, 46, 46, 0.10)'
      }}
    />
  )
}
