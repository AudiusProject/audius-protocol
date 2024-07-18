import { useFormikContext } from 'formik'

import { ConfirmationDrawer } from 'app/components/drawers'

import type { FormValues } from '../types'

const messages = {
  header: 'Confirm Update',
  description:
    "You're about to change the audience for your content.  This update may cause others to lose the ability to listen and share.",
  cancel: 'Go Cancel',
  confirm: 'Update Audience'
}

type EditPriceAndAudienceConfirmationDrawerProps = {
  onConfirm: () => void
  onCancel?: () => void
}

export const EditPriceAndAudienceConfirmationDrawer = (
  props: EditPriceAndAudienceConfirmationDrawerProps
) => {
  const { onConfirm, onCancel } = props
  const { initialValues } = useFormikContext<FormValues>()
  const wasScheduledRelease = initialValues.is_scheduled_release

  return (
    <ConfirmationDrawer
      variant='affirmative'
      modalName='EditPriceAndAudienceConfirmation'
      onConfirm={onConfirm}
      onCancel={onCancel}
      messages={messages}
    />
  )
}
