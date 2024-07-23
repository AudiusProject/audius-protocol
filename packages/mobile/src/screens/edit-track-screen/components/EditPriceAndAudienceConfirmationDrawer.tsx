import { ConfirmationDrawer } from 'app/components/drawers'

const messages = {
  header: 'Confirm Update',
  description:
    "You're about to change the audience for your content.  This update may cause others to lose the ability to listen and share.",
  cancel: 'Cancel',
  confirm: 'Update Audience'
}

type EditPriceAndAudienceConfirmationDrawerProps = {
  onConfirm: () => void
  onCancel?: () => void
}

export const EditPriceAndAudienceConfirmationDrawer = (
  props: EditPriceAndAudienceConfirmationDrawerProps
) => {
  return (
    <ConfirmationDrawer
      variant='affirmative'
      modalName='EditPriceAndAudienceConfirmation'
      onConfirm={props.onConfirm}
      onCancel={props.onCancel}
      messages={messages}
    />
  )
}
