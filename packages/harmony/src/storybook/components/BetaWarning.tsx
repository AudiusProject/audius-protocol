import { useTheme } from '@storybook/theming'

import { Tip } from './Tip'

const messages = {
  title: '🚧️ Beta component',
  description:
    'This component is currently being developed and is ready for exploratory usage. Please note that there may be breaking changes in future minor version updates and use with caution.'
}
export const BetaWarning = () => {
  const theme = useTheme()

  return (
    <Tip
      title={messages.title}
      description={messages.description}
      css={{
        borderColor: theme.color.primary,
        background: 'rgba(90, 73, 202, 0.10)'
      }}
    />
  )
}
