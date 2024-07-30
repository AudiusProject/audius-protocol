import { ConfirmationDrawer } from 'app/components/drawers'

const messages = {
  release: {
    header: 'Confirm Release',
    description:
      'Are you sure you want to make this track public? Your followers will be notified.',
    cancel: 'Cancel',
    confirm: 'Release Now'
  },
  earlyRelease: {
    header: 'Confirm Early Release',
    description:
      'Do you want to release your track now? Your followers will be notified.',
    cancel: 'Cancel',
    confirm: 'Release Now'
  },
  hidden: {
    header: 'Confirm Update',
    description:
      "You're about to change your content from public to hidden. It will be hidden from the public and your followers will lose access.",
    cancel: 'Cancel',
    confirm: 'Make Hidden'
  }
}

type ConfirmPublishDrawerProps = {
  type: 'release' | 'early_release' | 'hidden'
  onConfirm: () => void
}

export const ConfirmPublishDrawer = (props: ConfirmPublishDrawerProps) => {
  const { type, onConfirm } = props

  const confirmationMessages =
    type === 'release'
      ? messages.release
      : type === 'early_release'
      ? messages.earlyRelease
      : messages.hidden

  return (
    <ConfirmationDrawer
      variant='affirmative'
      modalName='EditAccessConfirmation'
      onConfirm={onConfirm}
      messages={confirmationMessages}
      addBottomInset
    />
  )
}
