import { IconRemix, Button } from '@audius/harmony'

const messages = {
  remixSettings: 'Remix Settings',
  hideRemixes: 'Hide Remixes on Track Page'
}

type RemixSettingsModalTriggerProps = {
  className?: string
  onClick: () => void
  hideRemixes: boolean
  handleToggle: () => void
}

export const RemixSettingsModalTrigger = (
  props: RemixSettingsModalTriggerProps
) => {
  return (
    <Button
      className={props.className}
      variant='secondary'
      name='remixSettings'
      size='small'
      onClick={props.onClick}
      iconLeft={IconRemix}
    >
      {messages.remixSettings}
    </Button>
  )
}
