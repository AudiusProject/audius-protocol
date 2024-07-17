import { useFormikContext } from 'formik'

import { ConfirmationDrawer } from 'app/components/drawers'

import type { FormValues } from '../types'

const messages = {
  release: {
    header: 'Confirm Release',
    description:
      'Are you sure you want to make this track public? Your followers will be notified.'
  },
  earlyRelease: {
    header: 'Confirm Early Release',
    description:
      'Do you want to release your track now? Your followers will be notified.'
  },
  common: {
    cancel: 'Go Back',
    confirm: 'Release Now'
  }
}

type ConfirmPublishTrackDrawerProps = {
  onConfirm: () => void
}

export const ConfirmPublishTrackDrawer = (
  props: ConfirmPublishTrackDrawerProps
) => {
  const { onConfirm } = props
  const { initialValues } = useFormikContext<FormValues>()
  const wasScheduledRelease = initialValues.is_scheduled_release

  const confirmationMessages = {
    ...messages.common,
    ...(wasScheduledRelease ? messages.release : messages.earlyRelease)
  }

  return (
    <ConfirmationDrawer
      variant='affirmative'
      modalName='EditAccessConfirmation'
      onConfirm={onConfirm}
      messages={confirmationMessages}
    />
  )
}
