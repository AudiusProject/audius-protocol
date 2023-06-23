import { TextAreaField } from 'app/components/fields'

const messages = {
  label: 'Description'
}

export const PlaylistDescriptionField = () => {
  const name = 'description'
  const maxLength = 256

  return (
    <TextAreaField name={name} label={messages.label} maxLength={maxLength} />
  )
}
