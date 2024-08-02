import { TextField } from 'app/components/fields'

const messages = {
  label: 'Name'
}

export const CollectionNameField = () => {
  return <TextField required name='playlist_name' label={messages.label} />
}
