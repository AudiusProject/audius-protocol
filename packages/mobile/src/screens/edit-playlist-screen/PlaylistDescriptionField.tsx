import { TextAreaField } from 'app/components/fields'

const messages = {
  label: 'Description'
}

export const PlaylistDescriptionField = () => {
  const name = 'description'
  const maxLength = 1000

  return (
    <TextAreaField name={name} label={messages.label} maxLength={maxLength} />
  )
}
