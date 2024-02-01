import { IconRemix } from '@audius/harmony'
import { Button, ButtonSize, ButtonType } from '@audius/stems'

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
      type={ButtonType.COMMON_ALT}
      name='remixSettings'
      text={messages.remixSettings}
      size={ButtonSize.SMALL}
      onClick={props.onClick}
      leftIcon={<IconRemix />}
    />
  )
}
