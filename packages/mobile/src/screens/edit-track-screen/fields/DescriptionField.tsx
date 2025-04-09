import { TextAreaField } from 'app/components/fields'

const messages = {
  label: 'Description'
}

export const DescriptionField = () => {
  const name = 'description'
  const maxLength = 2500

  return (
    <TextAreaField name={name} label={messages.label} maxLength={maxLength} />
  )
}
