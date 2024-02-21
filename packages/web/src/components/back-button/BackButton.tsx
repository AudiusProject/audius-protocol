import { IconCaretLeft, IconButton } from '@audius/harmony'

const messages = {
  goBack: 'Go Back'
}

type BackButtonProps = {
  onClick: () => void
}

export const BackButton = (props: BackButtonProps) => {
  return (
    <IconButton
      {...props}
      css={(theme) => ({ marginRight: theme.spacing.l })}
      icon={IconCaretLeft}
      aria-label={messages.goBack}
      color='subdued'
    />
  )
}
